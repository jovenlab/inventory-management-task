import '@/styles/globals.css';
import { useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, IconButton, Tooltip } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useRouter } from 'next/router';
import { createAppTheme } from '@/theme';

const COLOR_MODE_STORAGE_KEY = 'inventory_color_mode';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [mode, setMode] = useState('light');

  // Load initial preference from localStorage (if present)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      setMode(stored);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setMode('dark');
    }
  }, []);

  // Persist preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  }, [mode]);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Global keyboard shortcuts for navigation (Alt + key)
  useEffect(() => {
    const handler = (event) => {
      const target = event.target;
      const tag = target && target.tagName ? target.tagName.toLowerCase() : '';
      const isTypingField =
        tag === 'input' || tag === 'textarea' || target.isContentEditable;

      if (isTypingField) return;
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

      const key = event.key.toLowerCase();
      switch (key) {
        case 'd':
          event.preventDefault();
          router.push('/');
          break;
        case 'p':
          event.preventDefault();
          router.push('/products');
          break;
        case 'w':
          event.preventDefault();
          router.push('/warehouses');
          break;
        case 's':
          event.preventDefault();
          router.push('/stock');
          break;
        case 't':
          event.preventDefault();
          router.push('/transfers');
          break;
        case 'a':
          event.preventDefault();
          router.push('/alerts');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Accessible skip link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          color: 'text.primary',
        }}
      >
        <Component {...pageProps} />
        {/* Floating dark mode toggle visible on all pages */}
        <Box
          sx={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            zIndex: (t) => t.zIndex.tooltip + 1,
          }}
        >
          <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
            <IconButton
              color="inherit"
              onClick={toggleMode}
              aria-label={
                mode === 'light'
                  ? 'Switch to dark color mode'
                  : 'Switch to light color mode'
              }
              size="medium"
            >
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

