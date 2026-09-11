'use client';
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { CloudSyncOutlined, LinkOutlined, StorefrontOutlined } from '@mui/icons-material';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
const apps = [
  {
    name: 'Mercado Livre',
    provider: 'MERCADOLIVRE',
    description: 'Sincronize pedidos, anúncios e custos da sua loja.',
  },
  { name: 'Shopee', description: 'Marketplace preparado para Seller Pulse.' },
  { name: 'Amazon', description: 'Marketplace preparado para Seller Pulse.' },
  { name: 'Bling', description: 'ERP preparado para Seller Pulse.' },
  { name: 'Omie', description: 'ERP preparado para Seller Pulse.' },
  { name: 'Tiny', description: 'ERP preparado para Seller Pulse.' },
];
export default function Integrations() {
  const [integrations, setIntegrations] = useState<any[]>([]),
    [loading, setLoading] = useState(true),
    [syncing, setSyncing] = useState(false);
  useEffect(() => {
    api
      .get('/integrations')
      .then(({ data }) => setIntegrations(data))
      .finally(() => setLoading(false));
  }, []);
  const ml = integrations.find((x) => x.provider === 'MERCADOLIVRE');
  const connect = async () => {
    const { data } = await api.get('/integrations/mercadolivre/connect');
    window.location.assign(data.url);
  };
  const sync = async () => {
    setSyncing(true);
    try {
      await api.post('/integrations/mercadolivre/sync');
    } finally {
      setSyncing(false);
    }
  };
  return (
    <Shell>
      <div className="page">
        <Stack spacing={0.5} sx={{ mb: 3.5 }}>
          <Typography variant="h4" fontWeight={800}>
            Integrações
          </Typography>
          <Typography className="muted">Conecte seus canais e centralize a operação.</Typography>
        </Stack>
        <Box
          className="grid"
          sx={{
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2,minmax(0,1fr))',
              lg: 'repeat(3,minmax(0,1fr))',
            },
            alignItems: 'stretch',
          }}
        >
          {apps.map((app) => {
            const connected = app.provider && ml?.status === 'CONNECTED';
            return (
              <Card
                key={app.name}
                className="card"
                variant="outlined"
                sx={{
                  height: '100%',
                  borderColor: connected ? 'success.light' : 'divider',
                  boxShadow: connected ? '0 8px 24px rgba(16,185,129,.08)' : 'none',
                }}
              >
                <CardContent
                  sx={{
                    p: 2.5,
                    '&:last-child': { pb: 2.5 },
                    minHeight: 218,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: connected ? 'rgba(22,163,74,.10)' : 'rgba(79,70,229,.10)',
                        color: connected ? 'success.main' : 'primary.main',
                      }}
                    >
                      <StorefrontOutlined fontSize="small" />
                    </Box>
                    <Chip
                      size="small"
                      label={connected ? 'Conectado' : 'Em breve'}
                      color={connected ? 'success' : 'default'}
                      variant={connected ? 'filled' : 'outlined'}
                    />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" fontWeight={750}>
                      {app.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      className="muted"
                      sx={{ mt: 0.5, lineHeight: 1.45 }}
                    >
                      {app.description}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Divider sx={{ mb: 1.5 }} />
                    {app.provider ? (
                      connected ? (
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Button
                            size="small"
                            startIcon={
                              syncing ? <CircularProgress size={14} /> : <CloudSyncOutlined />
                            }
                            disabled={syncing}
                            onClick={sync}
                          >
                            Sincronizar
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => api.post('/integrations/mercadolivre/disconnect')}
                          >
                            Desconectar
                          </Button>
                        </Stack>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<LinkOutlined />}
                          onClick={connect}
                        >
                          Conectar
                        </Button>
                      )
                    ) : (
                      <Typography variant="caption" className="muted">
                        Disponível em breve
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </div>
    </Shell>
  );
}
