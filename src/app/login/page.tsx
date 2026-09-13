'use client';
import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
export default function Login() {
  const r = useRouter(),
    [email, setE] = useState('demo@sellerpulse.com'),
    [password, setP] = useState('demo1234'),
    [err, setErr] = useState('');
  async function go() {
    try {
      const x = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', x.data.accessToken);
      r.push('/');
    } catch {
      setErr('Não foi possível entrar. Verifique seus dados.');
    }
  }
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 430 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" fontWeight={600} color="primary">
            seller pulse
          </Typography>
          <Typography className="muted" mb={3}>
            Entre para acompanhar sua operação.
          </Typography>
          {err && <Alert severity="error">{err}</Alert>}
          <TextField
            fullWidth
            label="E-mail"
            margin="normal"
            value={email}
            onChange={(e) => setE(e.target.value)}
          />
          <TextField
            fullWidth
            label="Senha"
            type="password"
            margin="normal"
            value={password}
            onChange={(e) => setP(e.target.value)}
          />
          <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={go}>
            Entrar
          </Button>
          <Button fullWidth sx={{ mt: 1 }} onClick={() => r.push('/register')}>
            Criar conta
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
