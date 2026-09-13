'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { ArrowBack, Storefront } from '@mui/icons-material';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import MercadoLivreListingForm from './providers/mercadolivre/MercadoLivreListingForm';

export default function CreateListingPage() {
  const [marketplaces, setMarketplaces] = useState<any[]>();
  const [selected, setSelected] = useState<any>();
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api
      .get('/listing-creation/marketplaces')
      .then((response) => setMarketplaces(response.data))
      .catch(() => {
        setLoadError(
          'A API de criacao de anuncios ainda nao esta disponivel no backend conectado. Atualize/reinicie o backend e tente novamente.',
        );
        setMarketplaces([]);
      });
  }, []);

  return (
    <Shell>
      <div className="page">
        <Stack spacing={2}>
          <Box>
            <Button component={Link} href="/listings" startIcon={<ArrowBack />} sx={{ mb: 1 }}>
              Voltar
            </Button>
            <Typography variant="h4" fontWeight={600}>
              Criar anúncio
            </Typography>
            <Typography className="muted">
              Escolha o marketplace e preencha o formulário orientado pelas regras da plataforma.
            </Typography>
          </Box>

          {loadError && <Alert severity="error">{loadError}</Alert>}

          {!marketplaces ? (
            <CircularProgress />
          ) : !selected ? (
            <Grid container spacing={2}>
              {marketplaces.map((marketplace) => (
                <Grid item xs={12} md={4} key={marketplace.marketplace}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Storefront color="primary" />
                          <Chip
                            label={
                              marketplace.connected
                                ? marketplace.ready
                                  ? 'Conectado'
                                  : 'Em breve'
                                : 'Não conectado'
                            }
                            color={
                              marketplace.connected && marketplace.ready ? 'success' : 'default'
                            }
                            size="small"
                          />
                        </Stack>
                        <Box>
                          <Typography fontWeight={600}>{marketplace.name}</Typography>
                          <Typography className="muted" variant="body2">
                            {marketplace.message ||
                              'Crie anúncios usando metadados e validações do marketplace.'}
                          </Typography>
                        </Box>
                        {marketplace.connected && marketplace.ready ? (
                          <Button variant="contained" onClick={() => setSelected(marketplace)}>
                            Criar anúncio
                          </Button>
                        ) : marketplace.connected ? (
                          <Button disabled>Indisponível agora</Button>
                        ) : (
                          <Button component={Link} href="/integrations">
                            Conectar integração
                          </Button>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : selected.marketplace === 'MERCADOLIVRE' ? (
            <Stack spacing={2}>
              <Alert severity="info">
                Mercado Livre selecionado. A publicação real só acontece no último passo, ao clicar
                em PUBLICAR NO MERCADO LIVRE.
              </Alert>
              <MercadoLivreListingForm integrationId={selected.integrationId} />
            </Stack>
          ) : (
            <Alert severity="warning">
              Criação para este marketplace ainda não está disponível.
            </Alert>
          )}
        </Stack>
      </div>
    </Shell>
  );
}
