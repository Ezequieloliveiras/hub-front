'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { Sync } from '@mui/icons-material';
import Shell from '@/components/Shell';
import { api, money } from '@/lib/api';
export default function Listings() {
  const [data, setData] = useState<any>(),
    [syncing, setSyncing] = useState(false);
  const load = () => api.get('/listings').then((r) => setData(r.data));
  useEffect(() => {
    load();
  }, []);
  const sync = async () => {
    setSyncing(true);
    try {
      await api.post('/integrations/mercadolivre/sync');
      await load();
    } finally {
      setSyncing(false);
    }
  };
  return (
    <Shell>
      <div className="page">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={800}>
              Anúncios
            </Typography>
            <Typography className="muted">
              Acompanhe e gerencie seus anúncios nos marketplaces conectados.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={syncing ? <CircularProgress size={16} /> : <Sync />}
            disabled={syncing}
            onClick={sync}
          >
            Sincronizar anúncios
          </Button>
        </Box>
        <Card>
          <CardContent>
            {!data ? (
              <CircularProgress />
            ) : data.items.length === 0 ? (
              <Typography className="muted">Nenhum anúncio sincronizado ainda.</Typography>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>ID</th>
                    <th>Preço</th>
                    <th>Estoque</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((x: any) => (
                    <tr key={x.id}>
                      <td>
                        <b>{x.title}</b>
                      </td>
                      <td>{x.externalId}</td>
                      <td>{money(Number(x.price))}</td>
                      <td>{x.availableQuantity}</td>
                      <td>
                        <Chip size="small" label={x.status === 'active' ? 'Ativo' : x.status} />
                      </td>
                      <td>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" component={Link} href={`/listings/${x.id}`}>
                            Detalhes
                          </Button>
                          {x.permalink && (
                            <Button
                              size="small"
                              href={x.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Abrir
                            </Button>
                          )}
                        </Stack>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
