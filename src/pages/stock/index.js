import { useCallback, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Container,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  AppBar,
  Toolbar,
  Box,
  InputAdornment,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { buildCsv, downloadTextFile, exportTableToPdf } from '@/utils/export';

export default function Stock() {
  const [stock, setStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState(null);
  const [search, setSearch] = useState('');
  const [productId, setProductId] = useState('all');
  const [warehouseId, setWarehouseId] = useState('all');
  const [minQty, setMinQty] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    Promise.all([
      fetch('/api/stock').then(res => res.json()),
      fetch('/api/products').then(res => res.json()),
      fetch('/api/warehouses').then(res => res.json()),
    ]).then(([stockData, productsData, warehousesData]) => {
      setStock(stockData);
      setProducts(productsData);
      setWarehouses(warehousesData);
    });
  };

  const getProductName = useCallback(
    (productId) => {
      const product = products.find((p) => p.id === productId);
      return product ? `${product.name} (${product.sku})` : 'Unknown';
    },
    [products]
  );

  const getWarehouseName = useCallback(
    (warehouseId) => {
      const warehouse = warehouses.find((w) => w.id === warehouseId);
      return warehouse ? `${warehouse.name} (${warehouse.code})` : 'Unknown';
    },
    [warehouses]
  );

  const filteredStock = useMemo(() => {
    const q = search.trim().toLowerCase();
    const min = minQty === '' ? null : Number(minQty);
    return stock.filter((row) => {
      if (!row) return false;
      if (productId !== 'all' && Number(row.productId) !== Number(productId)) return false;
      if (warehouseId !== 'all' && Number(row.warehouseId) !== Number(warehouseId)) return false;
      if (min != null && Number.isFinite(min) && Number(row.quantity) < min) return false;
      if (!q) return true;
      const productText = getProductName(row.productId).toLowerCase();
      const warehouseText = getWarehouseName(row.warehouseId).toLowerCase();
      return (
        productText.includes(q) ||
        warehouseText.includes(q) ||
        String(row.quantity ?? '').toLowerCase().includes(q)
      );
    });
  }, [stock, productId, warehouseId, minQty, search, getProductName, getWarehouseName]);

  const handleExportCsv = () => {
    const csv = buildCsv(filteredStock, [
      { header: 'Product', value: (r) => getProductName(r.productId) },
      { header: 'Warehouse', value: (r) => getWarehouseName(r.warehouseId) },
      { header: 'Quantity', value: (r) => r.quantity },
    ]);
    downloadTextFile({
      filename: `stock-levels-${new Date().toISOString().slice(0, 10)}.csv`,
      contents: csv,
      mimeType: 'text/csv;charset=utf-8;',
    });
  };

  const handleExportPdf = async () => {
    await exportTableToPdf({
      filename: `stock-levels-${new Date().toISOString().slice(0, 10)}.pdf`,
      title: 'Stock levels',
      headers: ['Product', 'Warehouse', 'Quantity'],
      rows: filteredStock.map((r) => [
        getProductName(r.productId),
        getWarehouseName(r.warehouseId),
        r.quantity ?? 0,
      ]),
    });
  };

  const handleClickOpen = (id) => {
    setSelectedStockId(id);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedStockId(null);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/stock/${selectedStockId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setStock(stock.filter((item) => item.id !== selectedStockId));
        handleClose();
      }
    } catch (error) {
      console.error('Error deleting stock:', error);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <InventoryIcon sx={{ mr: 2 }} />
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

      <Container id="main-content" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Stock Levels
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            href="/stock/add"
          >
            Add Stock Record
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search product, warehouse, qty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 260 }}
          />
          <TextField
            size="small"
            select
            label="Product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="all">All</MenuItem>
            {products.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            label="Warehouse"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="all">All</MenuItem>
            {warehouses.map((w) => (
              <MenuItem key={w.id} value={w.id}>
                {w.name} ({w.code})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Min qty"
            type="number"
            value={minQty}
            onChange={(e) => setMinQty(e.target.value)}
            inputProps={{ min: 0 }}
            sx={{ width: 120 }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: { xs: 0, sm: 'auto' } }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={handleExportCsv}
              disabled={filteredStock.length === 0}
            >
              Export CSV
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PictureAsPdfOutlinedIcon />}
              onClick={handleExportPdf}
              disabled={filteredStock.length === 0}
            >
              Export PDF
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Product</strong></TableCell>
                <TableCell><strong>Warehouse</strong></TableCell>
                <TableCell align="right"><strong>Quantity</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStock.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{getProductName(item.productId)}</TableCell>
                  <TableCell>{getWarehouseName(item.warehouseId)}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      component={Link}
                      href={`/stock/edit/${item.id}`}
                      size="small"
                      aria-label={`Edit stock record ${item.id}`}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleClickOpen(item.id)}
                      size="small"
                      aria-label={`Delete stock record ${item.id}`}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStock.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No stock records match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Delete Stock Record</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this stock record? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleDelete} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}

