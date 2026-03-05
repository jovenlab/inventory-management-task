import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  AppBar,
  Toolbar,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import ParkIcon from '@mui/icons-material/Park';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
const API_BASE = '';
export default function TransfersPage() {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stock, setStock] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [form, setForm] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    productId: '',
    quantity: '',
  });
  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`${API_BASE}/api/products`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_BASE}/api/warehouses`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_BASE}/api/stock`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_BASE}/api/transfers`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([productsData, warehousesData, stockData, transfersData]) => {
        setProducts(Array.isArray(productsData) ? productsData : []);
        setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
        setStock(Array.isArray(stockData) ? stockData : []);
        setTransfers(Array.isArray(transfersData) ? transfersData : []);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load data');
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    loadData();
  }, []);
  const availableAtSource = useMemo(() => {
    if (!form.fromWarehouseId || !form.productId) return null;
    const row = stock.find(
      (s) =>
        Number(s.warehouseId) === Number(form.fromWarehouseId) &&
        Number(s.productId) === Number(form.productId)
    );
    return row ? row.quantity : 0;
  }, [stock, form.fromWarehouseId, form.productId]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccessMessage(null);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fromId = Number(form.fromWarehouseId);
    const toId = Number(form.toWarehouseId);
    const productId = Number(form.productId);
    const quantity = Number(form.quantity);
    if (!fromId || !toId || !productId || quantity < 1) {
      setError('Please fill all fields with valid values.');
      return;
    }
    if (fromId === toId) {
      setError('Source and destination warehouse must be different.');
      return;
    }
    if (availableAtSource !== null && quantity > availableAtSource) {
      setError(`Insufficient stock. Available at source: ${availableAtSource}`);
      return;
    }
    setSubmitLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromWarehouseId: fromId,
          toWarehouseId: toId,
          productId,
          quantity,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || data.error || `Transfer failed (${res.status})`);
        return;
      }
      setSuccessMessage(`Transferred ${quantity} units successfully.`);
      setForm({ fromWarehouseId: '', toWarehouseId: '', productId: '', quantity: '' });
      loadData();
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };
  const getProductName = (id) => {
    const p = products.find((x) => x.id === id);
    return p ? `${p.name} (${p.sku})` : `Product #${id}`;
  };
  const getWarehouseName = (id) => {
    const w = warehouses.find((x) => x.id === id);
    return w ? `${w.name} (${w.code})` : `Warehouse #${id}`;
  };
  return (
    <>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar sx={{ flexWrap: 'wrap', gap: 1 }}>
          <ParkIcon sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Inventory Management System
          </Typography>
          <Button color="inherit" component={Link} href="/">
            Dashboard
          </Button>
          <Button color="inherit" component={Link} href="/products">
            Products
          </Button>
          <Button color="inherit" component={Link} href="/warehouses">
            Warehouses
          </Button>
          <Button color="inherit" component={Link} href="/stock">
            Stock Levels
          </Button>
          <Button color="inherit" component={Link} href="/transfers">
            Transfers
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          background: 'linear-gradient(180deg, rgba(45, 106, 79, 0.06) 0%, transparent 120px)',
          minHeight: '100vh',
          pb: 4,
        }}
      >
        <Container maxWidth="lg" sx={{ pt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={600} color="primary.dark">
            Stock Transfers
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Move inventory between warehouses. All transfers are recorded and stock levels update immediately.
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <>
              <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SwapHorizIcon color="primary" />
                  New Transfer
                </Typography>
                {successMessage && (
                  <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
                    {successMessage}
                  </Alert>
                )}
                {error && (
                  <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr auto' }, gap: 2, alignItems: 'start' }}>
                    <TextField
                      select
                      fullWidth
                      label="From warehouse"
                      name="fromWarehouseId"
                      value={form.fromWarehouseId}
                      onChange={handleChange}
                      required
                      size="small"
                    >
                      {warehouses.map((w) => (
                        <MenuItem key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      fullWidth
                      label="To warehouse"
                      name="toWarehouseId"
                      value={form.toWarehouseId}
                      onChange={handleChange}
                      required
                      size="small"
                    >
                      {warehouses.map((w) => (
                        <MenuItem key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      fullWidth
                      label="Product"
                      name="productId"
                      value={form.productId}
                      onChange={handleChange}
                      required
                      size="small"
                    >
                      {products.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      fullWidth
                      label="Quantity"
                      name="quantity"
                      type="number"
                      value={form.quantity}
                      onChange={handleChange}
                      required
                      size="small"
                      inputProps={{ min: 1, max: availableAtSource ?? undefined }}
                      InputProps={{
                        endAdornment: availableAtSource != null && (
                          <InputAdornment position="end">
                            <Typography variant="caption" color="text.secondary">
                              max {availableAtSource}
                            </Typography>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={submitLoading}
                    sx={{ mt: 2 }}
                  >
                    {submitLoading ? <CircularProgress size={24} color="inherit" /> : 'Transfer stock'}
                  </Button>
                </Box>
              </Paper>
              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <Typography variant="h6" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon color="primary" />
                  Transfer history
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Product</strong></TableCell>
                        <TableCell><strong>From</strong></TableCell>
                        <TableCell><strong>To</strong></TableCell>
                        <TableCell align="right"><strong>Qty</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transfers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                            No transfers yet. Create one above.
                          </TableCell>
                        </TableRow>
                      ) : (
                        transfers.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell>
                              {t.createdAt
                                ? new Date(t.createdAt).toLocaleString(undefined, {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })
                                : '—'}
                            </TableCell>
                            <TableCell>{getProductName(t.productId)}</TableCell>
                            <TableCell>{getWarehouseName(t.fromWarehouseId)}</TableCell>
                            <TableCell>{getWarehouseName(t.toWarehouseId)}</TableCell>
                            <TableCell align="right">{t.quantity}</TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color={t.status === 'completed' ? 'success.main' : 'text.secondary'}
                              >
                                {t.status || 'completed'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          )}
        </Container>
      </Box>
    </>
  );
}