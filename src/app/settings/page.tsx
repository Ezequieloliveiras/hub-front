'use client';
import { useEffect, useState } from 'react';
import { Button, Card, CardContent, TextField, Typography } from '@mui/material';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
export default function Settings() {
  const [c, setC] = useState<any>({});
  useEffect(() => {
    api.get('/settings/company').then((r) => setC(r.data));
  }, []);
  return (
    <Shell>
      <div className="page">
        <Typography variant="h4" fontWeight={800} mb={3}>
          Configurações
        </Typography>
        <Card sx={{ maxWidth: 600 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700}>
              Empresa
            </Typography>
            <TextField
              fullWidth
              margin="normal"
              label="Nome"
              value={c.name || ''}
              onChange={(e) => setC({ ...c, name: e.target.value })}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Documento"
              value={c.document || ''}
              onChange={(e) => setC({ ...c, document: e.target.value })}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Percentual estimado de imposto"
              type="number"
              value={Number(c.taxRate || 0) * 100}
              onChange={(e) => setC({ ...c, taxRate: +e.target.value / 100 })}
            />
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => api.patch('/settings/company', c)}
            >
              Salvar
            </Button>
            <Typography className="muted" variant="caption" display="block" mt={2}>
              Estimativa simplificada aplicada sobre o faturamento.
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ maxWidth: 600, mt: 2 }}>
          <CardContent>
            <Typography fontWeight={700}>Assinatura</Typography>
            <Typography className="muted">Plano atual: Free / Trial</Typography>
            <Button disabled>Gerenciar assinatura</Button>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
