'use client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

const theme = createTheme({
  palette: { primary: { main: '#4f46e5' }, background: { default: '#f6f8fb' } },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
    fontSize: 14,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h4: {
      fontSize: 28,
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.4px',
    },
    h6: {
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 1.35,
      letterSpacing: 0,
    },
    body1: {
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.45,
    },
    button: {
      fontSize: 14,
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: 0,
    },
  },
  components: {
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: 15,
          fontWeight: 400,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: 13,
          fontWeight: 400,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: 14,
          fontWeight: 400,
        },
        head: {
          fontWeight: 500,
        },
      },
    },
  },
});
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
