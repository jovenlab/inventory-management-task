// API: Stock Transfers — create and list transfers with atomic stock updates.
// Data integrity: We never deduct from source in one step and credit destination in another.
// We compute the full new stock state in memory, then persist in a defined order:
// 1) Write stock.json (single write with both source deduction and destination credit).
// 2) Write transfers.json (append the completed transfer record).
// If the process fails before (1), no state changes — safe. If it fails after (1) but before (2),
// stock is correct but the transfer is missing from history (audit gap only; no incorrect stock).
// If it fails after (2), both are consistent. We do not write the transfer record first and then
// update stock, so we never have a "completed" transfer without the corresponding stock movement.
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const STOCK_PATH = path.join(DATA_DIR, 'stock.json');
const TRANSFERS_PATH = path.join(DATA_DIR, 'transfers.json');
const WAREHOUSES_PATH = path.join(DATA_DIR, 'warehouses.json');
const PRODUCTS_PATH = path.join(DATA_DIR, 'products.json');

function readJson(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const transfers = readJson(TRANSFERS_PATH);
      const sortByNewest = (a, b) => (b.createdAt || 0) - (a.createdAt || 0);
      const sorted = Array.isArray(transfers) ? [...transfers].sort(sortByNewest) : [];
      res.status(200).json(sorted);
    } catch (err) {
      console.error('GET /api/transfers:', err);
      res.status(500).json({ message: 'Failed to load transfers', error: err.message });
    }
    return;
  }

  if (req.method === 'POST') {
    let stock, transfers, warehouses, products;
    try {
      stock = readJson(STOCK_PATH);
      transfers = readJson(TRANSFERS_PATH);
      warehouses = readJson(WAREHOUSES_PATH);
      products = readJson(PRODUCTS_PATH);
    } catch (err) {
      console.error('POST /api/transfers read:', err);
      res.status(500).json({ message: 'Failed to read data', error: err.message });
      return;
    }

    const body = req.body || {};
    const fromWarehouseId = body.fromWarehouseId != null ? Number(body.fromWarehouseId) : NaN;
    const toWarehouseId = body.toWarehouseId != null ? Number(body.toWarehouseId) : NaN;
    const productId = body.productId != null ? Number(body.productId) : NaN;
    const quantity = body.quantity != null ? Number(body.quantity) : NaN;

    // Validation
    if (!Number.isInteger(fromWarehouseId) || fromWarehouseId < 1) {
      res.status(400).json({ message: 'Invalid or missing fromWarehouseId' });
      return;
    }
    if (!Number.isInteger(toWarehouseId) || toWarehouseId < 1) {
      res.status(400).json({ message: 'Invalid or missing toWarehouseId' });
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      res.status(400).json({ message: 'Source and destination warehouse must be different' });
      return;
    }
    if (!Number.isInteger(productId) || productId < 1) {
      res.status(400).json({ message: 'Invalid or missing productId' });
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      res.status(400).json({ message: 'Quantity must be a positive integer' });
      return;
    }

    const warehouseIds = (warehouses || []).map((w) => w.id);
    if (!warehouseIds.includes(fromWarehouseId)) {
      res.status(400).json({ message: 'Source warehouse not found' });
      return;
    }
    if (!warehouseIds.includes(toWarehouseId)) {
      res.status(400).json({ message: 'Destination warehouse not found' });
      return;
    }
    const productExists = (products || []).some((p) => p.id === productId);
    if (!productExists) {
      res.status(400).json({ message: 'Product not found' });
      return;
    }

    const stockList = Array.isArray(stock) ? stock : [];
    const sourceRow = stockList.find((s) => s.productId === productId && s.warehouseId === fromWarehouseId);
    const sourceQty = sourceRow ? sourceRow.quantity : 0;
    if (sourceQty < quantity) {
      res.status(400).json({
        message: 'Insufficient stock at source warehouse',
        available: sourceQty,
        requested: quantity,
      });
      return;
    }

    // Build new stock state in memory (atomic view: deduct source, credit dest)
    const nextStockId = stockList.length
      ? Math.max(...stockList.map((s) => s.id)) + 1
      : 1;
    const transferList = Array.isArray(transfers) ? transfers : [];
    const nextTransferId = transferList.length
      ? Math.max(...transferList.map((t) => t.id)) + 1
      : 1;

    const newStock = stockList.map((row) => {
      if (row.productId === productId && row.warehouseId === fromWarehouseId) {
        return { ...row, quantity: row.quantity - quantity };
      }
      if (row.productId === productId && row.warehouseId === toWarehouseId) {
        return { ...row, quantity: row.quantity + quantity };
      }
      return row;
    });

    const destRow = stockList.find((s) => s.productId === productId && s.warehouseId === toWarehouseId);
    if (!destRow) {
      newStock.push({
        id: nextStockId,
        productId,
        warehouseId: toWarehouseId,
        quantity,
      });
    }

    const createdAt = new Date().toISOString();
    const transferRecord = {
      id: nextTransferId,
      fromWarehouseId,
      toWarehouseId,
      productId,
      quantity,
      status: 'completed',
      createdAt,
      completedAt: createdAt,
    };

    // Persist: stock first, then transfer record (see data-integrity comment at top)
    try {
      writeJson(STOCK_PATH, newStock);
      transferList.push(transferRecord);
      writeJson(TRANSFERS_PATH, transferList);
    } catch (err) {
      console.error('POST /api/transfers write:', err);
      res.status(500).json({ message: 'Failed to save transfer', error: err.message });
      return;
    }

    res.status(201).json(transferRecord);
    return;
  }

  res.status(405).json({ message: 'Method Not Allowed' });
}
