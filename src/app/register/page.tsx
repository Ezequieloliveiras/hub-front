'use client';

import { useState } from 'react';
import axios from 'axios';
import { ArrowBack, Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function Register() {
  const r = useRouter();
  const [d, setD] = useState({
    name: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState('');

  const passwordTooShort = d.password.length > 0 && d.password.length < 8;
  const passwordMismatch = d.confirmPassword.length > 0 && d.password !== d.confirmPassword;

  async function createCompany() {
    setErr('');

    if (d.password.length < 8) {
      setErr('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (d.password !== d.confirmPassword) {
      setErr('As senhas não conferem.');
      return;
    }

    try {
      const { confirmPassword, ...payload } = d;
      const x = await api.post('/auth/register', payload);
      localStorage.setItem('token', x.data.accessToken);
      r.push('/');
    } catch (error) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
        setErr(error.response.data.message);
        return;
      }

      setErr('Não foi possível criar a empresa. Verifique seus dados.');
    }
  }

  const passwordAdornment = (
    <InputAdornment position="end">
      <IconButton
        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
        edge="end"
        onClick={() => setShowPassword((value) => !value)}
        onMouseDown={(e) => e.preventDefault()}
      >
        {showPassword ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 430 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" fontWeight={600}>
            Comece agora
          </Typography>

          {err && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {err}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Seu nome"
            margin="normal"
            value={d.name}
            onChange={(e) => setD({ ...d, name: e.target.value })}
          />
          <TextField
            fullWidth
            label="Empresa"
            margin="normal"
            value={d.companyName}
            onChange={(e) => setD({ ...d, companyName: e.target.value })}
          />
          <TextField
            fullWidth
            label="E-mail"
            margin="normal"
            value={d.email}
            onChange={(e) => setD({ ...d, email: e.target.value })}
          />
          <TextField
            fullWidth
            label="Senha (min. 8)"
            type={showPassword ? 'text' : 'password'}
            margin="normal"
            value={d.password}
            error={passwordTooShort}
            helperText={passwordTooShort ? 'Use pelo menos 8 caracteres.' : ''}
            onChange={(e) => setD({ ...d, password: e.target.value })}
            InputProps={{ endAdornment: passwordAdornment }}
          />
          <TextField
            fullWidth
            label="Confirmar senha"
            type={showPassword ? 'text' : 'password'}
            margin="normal"
            value={d.confirmPassword}
            error={passwordMismatch}
            helperText={passwordMismatch ? 'As senhas não conferem.' : ''}
            onChange={(e) => setD({ ...d, confirmPassword: e.target.value })}
            InputProps={{ endAdornment: passwordAdornment }}
          />
          <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={createCompany}>
            Criar empresa
          </Button>
          <Button
            fullWidth
            startIcon={<ArrowBack />}
            sx={{ mt: 1 }}
            onClick={() => r.push('/login')}
          >
            Voltar para login
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
