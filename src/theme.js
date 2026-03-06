import { createTheme } from '@mui/material/styles';

// Design tokens for sustainable / eco-friendly palette in light and dark mode
export function getDesignTokens(mode = 'light') {
  const isLight = mode === 'light';

  return {
    palette: {
      mode,
      primary: {
        main: '#2d6a4f', // forest green
        light: '#40916c',
        dark: '#1b4332',
        contrastText: '#fff',
      },
      secondary: {
        main: '#52796f', // sage
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
      background: isLight
        ? {
            default: '#f8faf8',
            paper: '#ffffff',
          }
        : {
            default: '#0f172a',
            paper: '#020617',
          },
      text: isLight
        ? {
            primary: '#1b4332',
            secondary: '#52796f',
          }
        : {
            primary: '#e5f4eb',
            secondary: '#9ca3af',
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
            boxShadow: isLight
              ? '0 2px 12px rgba(45, 106, 79, 0.08)'
              : '0 2px 16px rgba(15, 23, 42, 0.9)',
            border: isLight
              ? '1px solid rgba(45, 106, 79, 0.1)'
              : '1px solid rgba(148, 163, 184, 0.35)',
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
  };
}

export function createAppTheme(mode = 'light') {
  return createTheme(getDesignTokens(mode));
}

// Default export keeps existing imports working (light mode)
const theme = createAppTheme('light');
export default theme;
