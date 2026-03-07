import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  AppBar,
  Toolbar,
  InputAdornment,
  TextField,
  Chip,
  Skeleton,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import InventoryIcon from '@mui/icons-material/Inventory';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import CategoryIcon from '@mui/icons-material/Category';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SearchIcon from '@mui/icons-material/Search';
import ParkIcon from '@mui/icons-material/Park';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { buildCsv, downloadTextFile, exportTableToPdf } from '@/utils/export';

const API_BASE = '';

function useDashboardData() {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stock, setStock] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`${API_BASE}/api/products`).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('Products failed'))
      ),
      fetch(`${API_BASE}/api/warehouses`).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('Warehouses failed'))
      ),
      fetch(`${API_BASE}/api/stock`).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('Stock failed'))
      ),
      fetch(`${API_BASE}/api/alerts?leadTimeDays=7`).then((r) =>
        r.ok ? r.json() : []
      ),
    ])
      .then(([productsData, warehousesData, stockData, alertsData]) => {
        if (!cancelled) {
          setProducts(Array.isArray(productsData) ? productsData : []);
          setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
          setStock(Array.isArray(stockData) ? stockData : []);
          setAlerts(Array.isArray(alertsData) ? alertsData : []);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load dashboard data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);
  return { products, warehouses, stock, alerts, loading, error };
}

function DashboardSkeleton() {
  return (
    <Container id="main-content" sx={{ pt: 4, mb: 4 }}>
      <Skeleton variant="text" width={200} height={48} sx={{ mb: 3 }} />
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Skeleton variant="rounded" height={120} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Skeleton variant="rounded" height={280} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Skeleton variant="rounded" height={280} />
        </Grid>
      </Grid>
      <Box sx={{ mt: 4 }}>
        <Skeleton variant="text" width={180} height={32} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={320} />
      </Box>
    </Container>
  );
}

const CHART_COLORS = ['#2d6a4f', '#40916c', '#52796f', '#84a98c', '#95d5b2'];



export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));


  const { products, warehouses, stock, alerts, loading, error } = useDashboardData();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'low' | 'ok'

  const totalValue = useMemo(() => {
    return stock.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + (product ? product.unitCost * item.quantity : 0);
    }, 0);
  }, [products, stock]);

  // Get products with stock across all warehouses
  const totalUnits = useMemo(() => {
    return stock.reduce((sum, item) => sum + item.quantity, 0);
  }, [stock]);

  const inventoryOverview = useMemo(() => {
    return products.map((product) => {
      const productStock = stock.filter((s) => s.productId === product.id);
      const totalQuantity = productStock.reduce((sum, s) => sum + s.quantity, 0);
      const value = totalQuantity * product.unitCost;
      return {
        ...product,
        totalQuantity,
        value,
        isLowStock: totalQuantity < product.reorderPoint,
      };
    });
  }, [products, stock]);

  const lowStockCount = useMemo(() => inventoryOverview.filter((i) => i.isLowStock).length, [inventoryOverview]);

  const filteredOverview = useMemo(() => {
    let list = inventoryOverview;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.sku?.toLowerCase().includes(q) ||
          i.name?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'low') list = list.filter((i) => i.isLowStock);
    if (statusFilter === 'ok') list = list.filter((i) => !i.isLowStock);
    return list;
  }, [inventoryOverview, search, statusFilter]);

  const handleExportOverviewCsv = () => {
    const csv = buildCsv(filteredOverview, [
      { header: 'SKU', value: (r) => r.sku },
      { header: 'Product', value: (r) => r.name },
      { header: 'Category', value: (r) => r.category },
      { header: 'Total stock', value: (r) => r.totalQuantity },
      { header: 'Reorder point', value: (r) => r.reorderPoint },
      { header: 'Status', value: (r) => (r.isLowStock ? 'Low stock' : 'In stock') },
    ]);
    downloadTextFile({
      filename: `inventory-overview-${new Date().toISOString().slice(0, 10)}.csv`,
      contents: csv,
      mimeType: 'text/csv;charset=utf-8;',
    });
  };

  const handleExportOverviewPdf = async () => {
    await exportTableToPdf({
      filename: `inventory-overview-${new Date().toISOString().slice(0, 10)}.pdf`,
      title: 'Inventory overview',
      headers: ['SKU', 'Product', 'Category', 'Total stock', 'Reorder point', 'Status'],
      rows: filteredOverview.map((r) => [
        r.sku ?? '',
        r.name ?? '',
        r.category ?? '',
        r.totalQuantity ?? 0,
        r.reorderPoint ?? 0,
        r.isLowStock ? 'Low stock' : 'In stock',
      ]),
    });
  };

  const chartValueByCategory = useMemo(() => {
    const byCategory = {};
    inventoryOverview.forEach((item) => {
      const cat = item.category || 'Other';
      byCategory[cat] = (byCategory[cat] || 0) + item.value;
    });
    return Object.entries(byCategory).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [inventoryOverview]);

  const chartStockByWarehouse = useMemo(() => {
    return warehouses.map((wh) => {
      const qty = stock
        .filter((s) => s.warehouseId === wh.id)
        .reduce((sum, s) => sum + s.quantity, 0);
      return { name: wh.name || wh.code || `Warehouse ${wh.id}`, quantity: qty, fill: CHART_COLORS[wh.id % CHART_COLORS.length] };
    });
  }, [warehouses, stock]);

  const openAlertsCount = useMemo(() => {
    if (!Array.isArray(alerts) || alerts.length === 0) return 0;
    return alerts.filter(
      (a) => a && a.needsReorder && a.workflowStatus !== 'resolved'
    ).length;
  }, [alerts]);

  if (loading) {
    return (
      <>
        <AppBar position="static" color="primary">
          <Toolbar>
            <ParkIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Inventory Management System
            </Typography>
            <Button color="inherit" component={Link} href="/products">Products</Button>
            <Button color="inherit" component={Link} href="/warehouses">Warehouses</Button>
            <Button color="inherit" component={Link} href="/stock">Stock Levels</Button>
            <Button color="inherit" component={Link} href="/transfers">Transfers</Button>
          </Toolbar>
        </AppBar>
        <DashboardSkeleton />
      </>
    );
  }

  if (error) {
    return (
      <>
        <AppBar position="static" color="primary">
          <Toolbar>
            <ParkIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Inventory Management System
            </Typography>
            <Button color="inherit" component={Link} href="/products">Products</Button>
            <Button color="inherit" component={Link} href="/warehouses">Warehouses</Button>
            <Button color="inherit" component={Link} href="/stock">Stock Levels</Button>
            <Button color="inherit" component={Link} href="/transfers">Transfers</Button>
          </Toolbar>
        </AppBar>
        <Container id="main-content" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography color="text.secondary">Check that the server is running and APIs are available.</Typography>
        </Container>
      </>
    );
  }
  
  return (
    <>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar sx={{ flexWrap: 'wrap', gap: 1 }}>
          <ParkIcon sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Inventory Management System
          </Typography>
          <Button color="inherit" component={Link} href="/products">Products</Button>
          <Button color="inherit" component={Link} href="/warehouses">Warehouses</Button>
          <Button color="inherit" component={Link} href="/stock">Stock Levels</Button>
          <Button color="inherit" component={Link} href="/transfers">Transfers</Button>
          <Button color="inherit" component={Link} href="/alerts">Alerts</Button>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          background: 'linear-gradient(180deg, rgba(45, 106, 79, 0.06) 0%, transparent 120px)',
          minHeight: '100vh',
          pb: 4,
        }}
      >
        <Container id="main-content" sx={{ pt: 4, mb: 4 }} maxWidth="xl">
          <Typography variant="h4" component="h1" gutterBottom fontWeight={600} color="primary.dark">
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Command center for warehouse operations
          </Typography>

          {/* Key metrics */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AttachMoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle2" color="text.secondary">Inventory Value</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color="primary.dark">
                    ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <InventoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle2" color="text.secondary">Total Units</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color="primary.dark">
                    {totalUnits.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle2" color="text.secondary">Products</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color="primary.dark">
                    {products.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <WarehouseIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle2" color="text.secondary">Warehouses</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color="primary.dark">
                    {warehouses.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <Card
                sx={{
                  height: '100%',
                  bgcolor:
                    lowStockCount > 0 || openAlertsCount > 0
                      ? 'warning.light'
                      : 'background.paper',
                  border:
                    lowStockCount > 0 || openAlertsCount > 0 ? 1 : 0,
                  borderColor: 'warning.dark',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <WarningAmberIcon
                      sx={{
                        mr: 1,
                        color:
                          lowStockCount > 0 || openAlertsCount > 0
                            ? 'warning.dark'
                            : 'text.secondary',
                      }}
                    />
                  <Typography variant="subtitle2" color="text.secondary">
                    Low stock & alerts
                  </Typography>
                  </Box>
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color={
                        lowStockCount > 0 || openAlertsCount > 0
                          ? 'warning.dark'
                          : 'primary.dark'
                      }
                    >
                    {lowStockCount}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {`Open alerts: ${openAlertsCount}`}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    component={Link}
                    href="/alerts"
                    sx={{ mt: 1.5 }}
                  >
                    View alerts
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', minHeight: 320 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>Inventory value by category</Typography>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={chartValueByCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartValueByCategory.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Value']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', minHeight: 320 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>Stock by warehouse</Typography>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartStockByWarehouse} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,106,79,0.1)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="quantity" name="Units" fill="#2d6a4f" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Inventory overview */}
          <Typography variant="h5" gutterBottom fontWeight={600}>
            Inventory overview
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by SKU, name, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                sx: { bgcolor: 'background.paper', borderRadius: 2 },
              }}
              sx={{ minWidth: 240 }}
            />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="All"
                onClick={() => setStatusFilter('all')}
                color={statusFilter === 'all' ? 'primary' : 'default'}
                variant={statusFilter === 'all' ? 'filled' : 'outlined'}
              />
              <Chip
                label="Low stock"
                onClick={() => setStatusFilter('low')}
                color={statusFilter === 'low' ? 'warning' : 'default'}
                variant={statusFilter === 'low' ? 'filled' : 'outlined'}
              />
              <Chip
                label="In stock"
                onClick={() => setStatusFilter('ok')}
                color={statusFilter === 'ok' ? 'success' : 'default'}
                variant={statusFilter === 'ok' ? 'filled' : 'outlined'}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: { xs: 0, sm: 'auto' } }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={handleExportOverviewCsv}
                disabled={filteredOverview.length === 0}
              >
                Export CSV
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PictureAsPdfOutlinedIcon />}
                onClick={handleExportOverviewPdf}
                disabled={filteredOverview.length === 0}
              >
                Export PDF
              </Button>
            </Box>
          </Box>

          {isMobile ? (
            <Grid container spacing={2}>
              {filteredOverview.map((item) => (
                <Grid item xs={12} key={item.id}>
                  <Card
                    sx={{
                      borderLeft: 4,
                      borderColor: item.isLowStock ? 'warning.main' : 'primary.light',
                      bgcolor: item.isLowStock ? 'warning.light' : 'background.paper',
                    }}
                  >
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">{item.sku}</Typography>
                      <Typography variant="subtitle1" fontWeight={600}>{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.category}</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2">Stock: <strong>{item.totalQuantity}</strong></Typography>
                        <Typography variant="body2">Reorder: <strong>{item.reorderPoint}</strong></Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={item.isLowStock ? 'Low stock' : 'In stock'}
                        color={item.isLowStock ? 'warning' : 'success'}
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table size={isTablet ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>SKU</TableCell>
                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>Product</TableCell>
                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>Category</TableCell>
                    <TableCell align="right" sx={{ color: 'primary.contrastText', fontWeight: 600 }}>Total stock</TableCell>
                    <TableCell align="right" sx={{ color: 'primary.contrastText', fontWeight: 600 }}>Reorder point</TableCell>
                    <TableCell sx={{ color: 'primary.contrastText', fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOverview.map((item) => (
                    <TableRow
                      key={item.id}
                      sx={{
                        bgcolor: item.isLowStock ? 'warning.light' : 'background.paper',
                        '&:hover': { bgcolor: item.isLowStock ? 'warning.light' : 'action.hover' },
                      }}
                    >
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell align="right">{item.totalQuantity.toLocaleString()}</TableCell>
                      <TableCell align="right">{item.reorderPoint.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={item.isLowStock ? 'Low stock' : 'In stock'}
                          color={item.isLowStock ? 'warning' : 'success'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {filteredOverview.length === 0 && (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No items match your filters.
            </Typography>
          )}
        </Container>
      </Box>
    </>
  );
}

