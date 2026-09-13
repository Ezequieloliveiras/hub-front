'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardContent, TextField, Typography } from '@mui/material';
import Shell from '@/components/Shell';
import { LabelWithInfo } from '@/components/InfoHint';
import { api, money } from '@/lib/api';

export default function Product({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<any>();
  const [cost, setCost] = useState('');

  useEffect(() => {
    params.then(({ id }) =>
      api.get(`/products/${id}`).then((response) => {
        setProduct(response.data);
        setCost(String(response.data.cost || ''));
      }),
    );
  }, [params]);

  if (!product) {
    return (
      <Shell>
        <div className="page">Carregando...</div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="page">
        <Typography variant="h4" fontWeight={600}>
          {product.name}
        </Typography>
        <Typography className="muted">SKU {product.sku}</Typography>
        <Card sx={{ mt: 3, maxWidth: 500 }}>
          <CardContent>
            <Typography fontWeight={600} component="div">
              <LabelWithInfo
                label="Custo unitario"
                info="Custo unitario cadastrado para o produto. Este valor entra nos calculos de lucro, margem e DRE."
              />
            </Typography>
            <TextField
              size="small"
              sx={{ mt: 2 }}
              value={cost}
              onChange={(event) => setCost(event.target.value)}
            />
            <Button
              sx={{ ml: 1, mt: 2 }}
              variant="contained"
              onClick={async () => {
                await api.patch(`/products/${product.id}/cost`, { cost: +cost });
                setProduct({ ...product, cost: +cost });
              }}
            >
              Salvar
            </Button>
            <Typography mt={2} component="div">
              <LabelWithInfo
                label={`Custo atual: ${money(product.cost)}`}
                info="Valor de custo salvo para uma unidade deste produto."
              />
            </Typography>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
