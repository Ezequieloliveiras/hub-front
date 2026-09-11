'use client';
import { useEffect, useState } from 'react';
import { Button, Card, CardContent, TextField, Typography } from '@mui/material';
import Shell from '@/components/Shell';
import { api, money } from '@/lib/api';
export default function Product({ params }: { params: Promise<{ id: string }> }) {
  const [p, setP] = useState<any>();
  const [c, setC] = useState('');
  useEffect(() => {
    params.then((x) =>
      api.get(`/products/${x.id}`).then((r) => {
        setP(r.data);
        setC(String(r.data.cost || ''));
      }),
    );
  }, [params]);
  if (!p)
    return (
      <Shell>
        <div className="page">Carregando…</div>
      </Shell>
    );
  return (
    <Shell>
      <div className="page">
        <Typography variant="h4" fontWeight={800}>
          {p.name}
        </Typography>
        <Typography className="muted">SKU {p.sku}</Typography>
        <Card sx={{ mt: 3, maxWidth: 500 }}>
          <CardContent>
            <Typography fontWeight={700}>Custo unitário</Typography>
            <TextField
              size="small"
              sx={{ mt: 2 }}
              value={c}
              onChange={(e) => setC(e.target.value)}
            />
            <Button
              sx={{ ml: 1, mt: 2 }}
              variant="contained"
              onClick={async () => {
                await api.patch(`/products/${p.id}/cost`, { cost: +c });
                setP({ ...p, cost: +c });
              }}
            >
              Salvar
            </Button>
            <Typography mt={2}>Custo atual: {money(p.cost)}</Typography>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
