// API: Low stock alerts and reorder recommendations.
// 
// Reorder quantity formula (per product):
// --------------------------------------
// For each product we compute:
// - totalStock: sum of quantities across all warehouses (from stock.json).
// - R (reorderPoint): per product, from products.json.
// - v (transferVelocityPerDay): average quantity moved per day between warehouses for this
//   product over the last VELOCITY_WINDOW_DAYS, using transfers.json where status === 'completed'.
// - L (leadTimeDays): configurable via ?leadTimeDays= query param, default DEFAULT_LEAD_TIME_DAYS.
//
// We then derive:
// - If v > 0:
//     projectedDemand = v * L
//     targetStock = R + projectedDemand
//   This means we want enough stock to cover expected inter‑warehouse movement during the lead
//   time, while still keeping the reorder point as safety stock.
//
// - If v === 0 (no or effectively zero transfer history):
//     projectedDemand = 0
//     targetStock = R
//   For new or slow‑moving products we fall back to the reorder point only, so we at least refill
//   up to R when we dip below it, instead of assuming zero demand.
//
// - Recommended reorder quantity:
//     recommendedQty = max(ceil(targetStock - totalStock), 0)
//
// Stock status categories:
// ------------------------
// We categorize each product using totalStock vs reorderPoint R:
// - 'critical'   : totalStock === 0, OR totalStock < 0.5 * R
// - 'low'        : totalStock >= 0.5 * R AND totalStock < R
// - 'adequate'   : totalStock >= R AND totalStock <= 2 * R
// - 'overstocked': totalStock > 2 * R
//
// If R is missing or <= 0, we treat any positive stock as 'adequate' and very large stock as
// 'overstocked'. In this dataset all products have a positive reorderPoint.
//
// Edge cases:
// -----------
// - New products / no transfer history:
//   v = 0 so targetStock = R. If totalStock < R we recommend R - totalStock; otherwise 0.
// - Zero velocity but existing history:
//   If transfers exist but average over the window is numerically 0 (very low movement), we
//   still use targetStock = R, so we don't over‑order for extremely slow movers.
// - Very small reorder points:
//   When R is small but v > 0, targetStock is dominated by projectedDemand (v * L), which is
//   appropriate: the product is moving quickly and we want to avoid reordering too frequently.
//
// Workflow status persistence:
// ----------------------------
// - alerts.json stores manager workflow state per productId:
//     { productId, workflowStatus: 'open' | 'in_progress' | 'resolved', notes?, updatedAt }
// - GET /api/alerts returns one record per product, combining live calculations with any
//   persisted workflow state. Products without explicit state default to:
//     - 'open' when status is 'critical' or 'low'
//     - 'resolved' when status is 'adequate' or 'overstocked'
// - POST /api/alerts allows updating the workflowStatus (and optional notes) for a product.

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PRODUCTS_PATH = path.join(DATA_DIR, 'products.json');
const STOCK_PATH = path.join(DATA_DIR, 'stock.json');
const TRANSFERS_PATH = path.join(DATA_DIR, 'transfers.json');
const ALERTS_PATH = path.join(DATA_DIR, 'alerts.json');

const DEFAULT_LEAD_TIME_DAYS = 7;
const VELOCITY_WINDOW_DAYS = 30;

function safeReadJson(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT' && fallback !== undefined) {
      return fallback;
    }
    throw err;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function classifyStatus(totalStock, reorderPoint) {
  const R = typeof reorderPoint === 'number' ? reorderPoint : 0;
  if (R <= 0) {
    if (totalStock <= 0) return 'critical';
    if (totalStock > 500) return 'overstocked';
    return 'adequate';
  }
  if (totalStock === 0 || totalStock < 0.5 * R) return 'critical';
  if (totalStock < R) return 'low';
  if (totalStock <= 2 * R) return 'adequate';
  return 'overstocked';
}

function buildAlerts({ leadTimeDays }) {
  const products = safeReadJson(PRODUCTS_PATH, []);
  const stock = safeReadJson(STOCK_PATH, []);
  const transfers = safeReadJson(TRANSFERS_PATH, []);
  const alertsState = safeReadJson(ALERTS_PATH, []);

  const stockByProduct = {};
  (Array.isArray(stock) ? stock : []).forEach((row) => {
    if (!row || row.productId == null) return;
    const pid = Number(row.productId);
    if (!Number.isFinite(pid)) return;
    stockByProduct[pid] = (stockByProduct[pid] || 0) + Number(row.quantity || 0);
  });

  const now = new Date();
  const windowStart = new Date(now.getTime() - VELOCITY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const velocityTotals = {};

  (Array.isArray(transfers) ? transfers : []).forEach((t) => {
    if (!t || t.productId == null) return;
    if (t.status && t.status !== 'completed') return;
    const createdAt = t.createdAt ? new Date(t.createdAt) : null;
    if (!createdAt || createdAt < windowStart) return;
    const pid = Number(t.productId);
    if (!Number.isFinite(pid)) return;
    velocityTotals[pid] = (velocityTotals[pid] || 0) + Number(t.quantity || 0);
  });

  const velocityPerDay = {};
  Object.keys(velocityTotals).forEach((pid) => {
    velocityPerDay[pid] = velocityTotals[pid] / VELOCITY_WINDOW_DAYS;
  });

  const workflowByProductId = {};
  (Array.isArray(alertsState) ? alertsState : []).forEach((a) => {
    if (!a || a.productId == null) return;
    workflowByProductId[Number(a.productId)] = a;
  });

  const alerts = (Array.isArray(products) ? products : []).map((p) => {
    const pid = Number(p.id);
    const totalStock = stockByProduct[pid] || 0;
    const reorderPoint = typeof p.reorderPoint === 'number' ? p.reorderPoint : 0;
    const status = classifyStatus(totalStock, reorderPoint);
    const v = velocityPerDay[pid] || 0;

    let targetStock;
    if (v > 0) {
      const projectedDemand = v * leadTimeDays;
      targetStock = reorderPoint + projectedDemand;
    } else {
      targetStock = reorderPoint;
    }

    const recommendedQtyRaw = Math.ceil(targetStock - totalStock);
    const recommendedQty = recommendedQtyRaw > 0 ? recommendedQtyRaw : 0;
    const needsReorder = (status === 'critical' || status === 'low') && recommendedQty > 0;

    const workflow = workflowByProductId[pid];
    let defaultWorkflowStatus;
    if (status === 'critical' || status === 'low') {
      defaultWorkflowStatus = 'open';
    } else {
      defaultWorkflowStatus = 'resolved';
    }

    const workflowStatus = workflow && workflow.workflowStatus
      ? workflow.workflowStatus
      : defaultWorkflowStatus;

    const dailyVelocity = v > 0 ? v : 0;
    const daysOfCover =
      dailyVelocity > 0 ? Number((totalStock / dailyVelocity).toFixed(1)) : null;

    return {
      productId: pid,
      sku: p.sku,
      name: p.name,
      category: p.category,
      reorderPoint,
      totalStock,
      status,
      transferVelocityPerDay: Number(dailyVelocity.toFixed(2)),
      leadTimeDays,
      recommendedReorderQty: recommendedQty,
      needsReorder,
      workflowStatus,
      notes: workflow && workflow.notes ? workflow.notes : '',
      daysOfCover,
    };
  });

  return alerts;
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const leadTimeParam = req.query && req.query.leadTimeDays;
      const leadTimeDaysRaw = Number(leadTimeParam);
      const leadTimeDays =
        Number.isFinite(leadTimeDaysRaw) && leadTimeDaysRaw > 0
          ? leadTimeDaysRaw
          : DEFAULT_LEAD_TIME_DAYS;

      const alerts = buildAlerts({ leadTimeDays });
      res.status(200).json(alerts);
    } catch (err) {
      console.error('GET /api/alerts:', err);
      res.status(500).json({ message: 'Failed to build alerts', error: err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const productId = body.productId != null ? Number(body.productId) : NaN;
    const workflowStatus = body.workflowStatus;
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';

    if (!Number.isInteger(productId) || productId < 1) {
      res.status(400).json({ message: 'Invalid or missing productId' });
      return;
    }

    const allowedStatuses = ['open', 'in_progress', 'resolved'];
    if (!allowedStatuses.includes(workflowStatus)) {
      res.status(400).json({ message: 'Invalid workflowStatus' });
      return;
    }

    let alertsState;
    try {
      alertsState = safeReadJson(ALERTS_PATH, []);
    } catch (err) {
      console.error('POST /api/alerts read:', err);
      res.status(500).json({ message: 'Failed to read alerts', error: err.message });
      return;
    }

    const list = Array.isArray(alertsState) ? alertsState : [];
    const existingIndex = list.findIndex((a) => Number(a.productId) === productId);
    const updatedAt = new Date().toISOString();

    const record = {
      productId,
      workflowStatus,
      notes,
      updatedAt,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...record };
    } else {
      list.push(record);
    }

    try {
      writeJson(ALERTS_PATH, list);
    } catch (err) {
      console.error('POST /api/alerts write:', err);
      res.status(500).json({ message: 'Failed to save alerts', error: err.message });
      return;
    }

    res.status(200).json(record);
    return;
  }

  res.status(405).json({ message: 'Method Not Allowed' });
}

