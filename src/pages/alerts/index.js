import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  AppBar,
  Toolbar,
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import ParkIcon from '@mui/icons-material/Park';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
const API_BASE = '';
const WORKFLOW_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];
export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leadTimeDays, setLeadTimeDays] = useState(7);
  const [leadTimeInput, setLeadTimeInput] = useState('7');
  const [updatingId, setUpdatingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // all | critical | low | adequate | overstocked
  const [workflowFilter, setWorkflowFilter] = useState('actionable'); // actionable | all | resolved
  const loadAlerts = (leadTime) => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/api/alerts?leadTimeDays=${leadTime}`)
      .then((r) => {
        if (!r.ok) {
          throw new Error('Failed to load alerts');
        }
        return r.json();
      })
      .then((data) => {
        setAlerts(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load alerts');
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    loadAlerts(leadTimeDays);
  }, []);
  const handleLeadTimeApply = () => {
    const num = Number(leadTimeInput);
    if (!Number.isFinite(num) || num <= 0) {
      setError('Lead time must be a positive number of days.');
      return;
    }
    setLeadTimeDays(num);
    loadAlerts(num);
  };
  const handleWorkflowChange = async (productId, status) => {
    setUpdatingId(productId);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, workflowStatus: status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update alert status');
      }
      setAlerts((prev) =>
        prev.map((a) =>
          a.productId === productId ? { ...a, workflowStatus: status } : a
        )
      );
    } catch (err) {
      setError(err.message || 'Failed to update alert status');
    } finally {
      setUpdatingId(null);
    }
  };
  const actionableAlerts = useMemo(
    () =>
      alerts.filter(
        (a) =>
          a &&
          a.needsReorder &&
          (a.workflowStatus === 'open' || a.workflowStatus === 'in_progress')
      ),
    [alerts]
  );
  const criticalCount = useMemo(
    () => actionableAlerts.filter((a) => a.status === 'critical').length,
    [actionableAlerts]
  );
  const lowCount = useMemo(
    () => actionableAlerts.filter((a) => a.status === 'low').length,
    [actionableAlerts]
  );
  const overstockedCount = useMemo(
    () => alerts.filter((a) => a.status === 'overstocked').length,
    [alerts]
  );
  const filteredAlerts = useMemo(() => {
    let list = alerts;
    if (statusFilter !== 'all') {
      list = list.filter((a) => a.status === statusFilter);
    }
    if (workflowFilter === 'actionable') {
      list = list.filter(
        (a) =>
          a.needsReorder &&
          (a.workflowStatus === 'open' || a.workflowStatus === 'in_progress')
      );
    } else if (workflowFilter === 'resolved') {
      list = list.filter((a) => a.workflowStatus === 'resolved');
    }
    return list;
  }, [alerts, statusFilter, workflowFilter]);
  const renderStatusChip = (status) => {
    if (status === 'critical') {
      return <Chip label="Critical" color="error" size="small" />;
    }
    if (status === 'low') {
      return <Chip label="Low" color="warning" size="small" />;
    }
    if (status === 'overstocked') {
      return <Chip label="Overstocked" color="info" size="small" />;
    }
    return <Chip label="Adequate" color="success" size="small" />;
  };
  const renderWorkflowChip = (workflowStatus) => {
    if (workflowStatus === 'in_progress') {
      return <Chip label="In progress" color="primary" size="small" />;
    }
    if (workflowStatus === 'resolved') {
      return <Chip label="Resolved" color="success" size="small" />;
    }
    return <Chip label="Open" color="warning" size="small" />;
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
          <Button color="inherit" component={Link} href="/alerts">
            Alerts
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          background:
            'linear-gradient(180deg, rgba(45, 106, 79, 0.06) 0%, transparent 120px)',
          minHeight: '100vh',
          pb: 4,
        }}
      >
        <Container maxWidth="lg" sx={{ pt: 4, mb: 4 }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            fontWeight={600}
            color="primary.dark"
          >
            Alerts & Reorders
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Monitor low stock across all warehouses, prioritize critical items, and
            track follow-up actions with workflow statuses.
          </Typography>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <WarningAmberIcon sx={{ mr: 1, color: 'error.main' }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Critical alerts
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color="error.main">
                    {criticalCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <WarningAmberIcon sx={{ mr: 1, color: 'warning.main' }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Low alerts
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color="warning.main">
                    {lowCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUpIcon sx={{ mr: 1, color: 'info.main' }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Overstocked
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color="info.main">
                    {overstockedCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="subtitle2" color="text.secondary">
                      Lead time (days)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      type="number"
                      value={leadTimeInput}
                      onChange={(e) => setLeadTimeInput(e.target.value)}
                      inputProps={{ min: 1 }}
                      sx={{ width: 80 }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleLeadTimeApply}
                    >
                      Apply
                    </Button>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 1 }}
                  >
                    Reorder quantities use velocity × lead time + safety stock.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <TextField
                  select
                  size="small"
                  label="Stock status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="adequate">Adequate</MenuItem>
                  <MenuItem value="overstocked">Overstocked</MenuItem>
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Workflow"
                  value={workflowFilter}
                  onChange={(e) => setWorkflowFilter(e.target.value)}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="actionable">Action needed</MenuItem>
                  <MenuItem value="all">All statuses</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                </TextField>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {filteredAlerts.length} products in view
              </Typography>
            </Box>
          </Paper>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <Paper
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      <TableCell
                        sx={{ color: 'primary.contrastText', fontWeight: 600 }}
                      >
                        Product
                      </TableCell>
                      <TableCell
                        sx={{ color: 'primary.contrastText', fontWeight: 600 }}
                      >
                        Category
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: 'primary.contrastText', fontWeight: 600 }}
                      >
                        Total stock
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: 'primary.contrastText', fontWeight: 600 }}
                      >
                        Reorder point
                      </TableCell>
                      <TableCell
                        sx={{ color: 'primary.contrastText', fontWeight: 600 }}
                      >
                        Stock status
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: 'primary.contrastText', fontWeight: 600 }}
                      >
                        Velocity (per day)
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: 'primary.contrastText', fontWeight: 600 }}
                      >
                        Days of cover
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: 'primary.contrastText', fontWeight: 600 }}
                      >
                        Recommended reorder
                      </TableCell>
                      <TableCell
                        sx={{ color: 'primary.contrastText', fontWeight: 600 }}
                      >
                        Workflow
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAlerts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No products match the current filters.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAlerts.map((a) => (
                        <TableRow
                          key={a.productId}
                          sx={{
                            bgcolor:
                              a.status === 'critical'
                                ? 'error.lighter'
                                : a.status === 'low'
                                ? 'warning.light'
                                : 'background.paper',
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {a.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {a.sku}
                            </Typography>
                          </TableCell>
                          <TableCell>{a.category}</TableCell>
                          <TableCell align="right">
                            {a.totalStock.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {a.reorderPoint.toLocaleString()}
                          </TableCell>
                          <TableCell>{renderStatusChip(a.status)}</TableCell>
                          <TableCell align="right">
                            {a.transferVelocityPerDay.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            {a.daysOfCover != null ? `${a.daysOfCover}d` : '—'}
                          </TableCell>
                          <TableCell align="right">
                            {a.recommendedReorderQty > 0
                              ? a.recommendedReorderQty.toLocaleString()
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flexWrap: 'wrap',
                              }}
                            >
                              {renderWorkflowChip(a.workflowStatus)}
                              <TextField
                                select
                                size="small"
                                value={a.workflowStatus}
                                onChange={(e) =>
                                  handleWorkflowChange(
                                    a.productId,
                                    e.target.value
                                  )
                                }
                                sx={{ minWidth: 130 }}
                                disabled={updatingId === a.productId}
                              >
                                {WORKFLOW_OPTIONS.map((opt) => (
                                  <MenuItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Container>
      </Box>
    </>
  );
}
