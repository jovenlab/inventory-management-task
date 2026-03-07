import { useMemo, useState, useEffect } from 'react';
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

export default function Products() {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data));
  };

  const handleClickOpen = (id) => {
    setSelectedProductId(id);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedProductId(null);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/products/${selectedProductId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProducts(products.filter((product) => product.id !== selectedProductId));
        handleClose();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const categories = useMemo(() => {
    const unique = new Set();
    products.forEach((p) => {
      if (p?.category) unique.add(p.category);
    });
    return Array.from(unique).sort((a, b) => String(a).localeCompare(String(b)));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (!p) return false;
      if (category !== 'all' && p.category !== category) return false;
      if (!q) return true;
      return (
        String(p.sku ?? '').toLowerCase().includes(q) ||
        String(p.name ?? '').toLowerCase().includes(q) ||
        String(p.category ?? '').toLowerCase().includes(q)
      );
    });
  }, [products, search, category]);

  const handleExportCsv = () => {
    const csv = buildCsv(filteredProducts, [
      { header: 'SKU', value: (r) => r.sku },
      { header: 'Name', value: (r) => r.name },
      { header: 'Category', value: (r) => r.category },
      { header: 'Unit cost', value: (r) => r.unitCost },
      { header: 'Reorder point', value: (r) => r.reorderPoint },
    ]);
    downloadTextFile({
      filename: `products-${new Date().toISOString().slice(0, 10)}.csv`,
      contents: csv,
      mimeType: 'text/csv;charset=utf-8;',
    });
  };

  const handleExportPdf = async () => {
    await exportTableToPdf({
      filename: `products-${new Date().toISOString().slice(0, 10)}.pdf`,
      title: 'Products',
      headers: ['SKU', 'Name', 'Category', 'Unit cost', 'Reorder point'],
      rows: filteredProducts.map((p) => [
        p.sku ?? '',
        p.name ?? '',
        p.category ?? '',
        Number(p.unitCost ?? 0).toFixed(2),
        p.reorderPoint ?? 0,
      ]),
    });
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
        </Toolbar>
      </AppBar>

      <Container id="main-content" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Products
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            href="/products/add"
          >
            Add Product
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search SKU, name, category..."
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
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">All</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: { xs: 0, sm: 'auto' } }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={handleExportCsv}
              disabled={filteredProducts.length === 0}
            >
              Export CSV
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PictureAsPdfOutlinedIcon />}
              onClick={handleExportPdf}
              disabled={filteredProducts.length === 0}
            >
              Export PDF
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table aria-label="Products table">
            <TableHead>
              <TableRow>
                <TableCell><strong>SKU</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell align="right"><strong>Unit Cost</strong></TableCell>
                <TableCell align="right"><strong>Reorder Point</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell align="right">${Number(product.unitCost ?? 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{product.reorderPoint}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      component={Link}
                      href={`/products/edit/${product.id}`}
                      size="small"
                      aria-label={`Edit product ${product.sku}`}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleClickOpen(product.id)}
                      size="small"
                      aria-label={`Delete product ${product.sku}`}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No products match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Delete Product</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this product? This action cannot be undone.
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

