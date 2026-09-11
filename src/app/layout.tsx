'use client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import './globals.css';
const theme = createTheme({
  palette: { primary: { main: '#4f46e5' }, background: { default: '#f6f8fb' } },
  shape: { borderRadius: 12 },
  typography: { fontFamily: 'Arial, sans-serif' },
});
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
