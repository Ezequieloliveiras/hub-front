'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, Chip, Typography } from '@mui/material';
import Link from 'next/link';
import Shell from '@/components/Shell';
import { api, money } from '@/lib/api';
export default function Products() {
  const [x, setX] = useState<any[]>([]);
  useEffect(() => {
    api.get('/products').then((r) => setX(r.data));
  }, []);
  return (
    <Shell>
      <div className="page">
        <Typography variant="h4" fontWeight={800} mb={3}>
          Produtos
        </Typography>
        <Card>
          <CardContent>
            <table className="table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>SKU</th>
                  <th>Custo</th>
                  <th>Marketplace</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {x.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/products/${p.id}`}>
                        <b>{p.name}</b>
                      </Link>
                    </td>
                    <td>{p.sku}</td>
                    <td>{p.cost ? money(p.cost) : 'Não informado'}</td>
                    <td>Mercado Livre</td>
                    <td>
                      <Chip size="small" label={p.active ? 'Ativo' : 'Inativo'} color="success" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
