import { createTheme } from '@mui/material/styles';

// Sustainable / eco-friendly palette – greens, earth tones, clean neutrals
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2d6a4f',   // forest green
      light: '#40916c',
      dark: '#1b4332',
      contrastText: '#fff',
    },
    secondary: {
      main: '#52796f',   // sage
      light: '#84a98c',
      dark: '#354f52',
      contrastText: '#fff',
    },
    success: {
      main: '#2d6a4f',
      light: '#95d5b2',
    },
    warning: {
      main: '#e9c46a',
      dark: '#d4a373',
    },
    error: {
      main: '#bc6c25',
      light: '#dda15e',
    },
    background: {
      default: '#f8faf8',
      paper: '#ffffff',
    },
    text: {
      primary: '#1b4332',
      secondary: '#52796f',
    },
  },
  typography: {
    fontFamily: '"DM Sans", "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(45, 106, 79, 0.08)',
          border: '1px solid rgba(45, 106, 79, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(45, 106, 79, 0.12)',
        },
      },
    },
  },
});

export default theme;
