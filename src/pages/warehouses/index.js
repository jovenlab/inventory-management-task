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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { buildCsv, downloadTextFile, exportTableToPdf } from '@/utils/export';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = () => {
    fetch('/api/warehouses')
      .then((res) => res.json())
      .then((data) => setWarehouses(data));
  };

  const handleClickOpen = (id) => {
    setSelectedWarehouseId(id);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedWarehouseId(null);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/warehouses/${selectedWarehouseId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setWarehouses(warehouses.filter((warehouse) => warehouse.id !== selectedWarehouseId));
        handleClose();
      }
    } catch (error) {
      console.error('Error deleting warehouse:', error);
    }
  };

  const filteredWarehouses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return warehouses;
    return warehouses.filter((w) => {
      if (!w) return false;
      return (
        String(w.code ?? '').toLowerCase().includes(q) ||
        String(w.name ?? '').toLowerCase().includes(q) ||
        String(w.location ?? '').toLowerCase().includes(q)
      );
    });
  }, [warehouses, search]);

  const handleExportCsv = () => {
    const csv = buildCsv(filteredWarehouses, [
      { header: 'Code', value: (r) => r.code },
      { header: 'Name', value: (r) => r.name },
      { header: 'Location', value: (r) => r.location },
    ]);
    downloadTextFile({
      filename: `warehouses-${new Date().toISOString().slice(0, 10)}.csv`,
      contents: csv,
      mimeType: 'text/csv;charset=utf-8;',
    });
  };

  const handleExportPdf = async () => {
    await exportTableToPdf({
      filename: `warehouses-${new Date().toISOString().slice(0, 10)}.pdf`,
      title: 'Warehouses',
      headers: ['Code', 'Name', 'Location'],
      rows: filteredWarehouses.map((w) => [w.code ?? '', w.name ?? '', w.location ?? '']),
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
            Warehouses
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            component={Link} 
            href="/warehouses/add"
          >
            Add Warehouse
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search code, name, location..."
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
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ml: { xs: 0, sm: 'auto' } }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadOutlinedIcon />}
              onClick={handleExportCsv}
              disabled={filteredWarehouses.length === 0}
            >
              Export CSV
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PictureAsPdfOutlinedIcon />}
              onClick={handleExportPdf}
              disabled={filteredWarehouses.length === 0}
            >
              Export PDF
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table aria-label="Warehouses table">
            <TableHead>
              <TableRow>
                <TableCell><strong>Code</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Location</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWarehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell>{warehouse.code}</TableCell>
                  <TableCell>{warehouse.name}</TableCell>
                  <TableCell>{warehouse.location}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      component={Link}
                      href={`/warehouses/edit/${warehouse.id}`}
                      size="small"
                      aria-label={`Edit warehouse ${warehouse.code}`}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleClickOpen(warehouse.id)}
                      size="small"
                      aria-label={`Delete warehouse ${warehouse.code}`}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredWarehouses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No warehouses match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Delete Warehouse</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this warehouse? This action cannot be undone.
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

