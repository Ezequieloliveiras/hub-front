'use client';

import { useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CloudSyncOutlined,
  LinkOutlined,
  SaveOutlined,
  SettingsOutlined,
  StorefrontOutlined,
} from '@mui/icons-material';
import Shell from '@/components/Shell';
import { hasFilters, ListFilters, useListQuery } from '@/components/ListControls';
import { api } from '@/lib/api';

const apps = [
  {
    name: 'Mercado Livre',
    provider: 'MERCADOLIVRE',
    description: 'Sincronize pedidos, anuncios e custos da sua loja.',
  },
  { name: 'Shopee', provider: 'SHOPEE', description: 'Marketplace preparado para Seller Pulse.' },
  { name: 'Amazon', provider: 'AMAZON', description: 'Marketplace preparado para Seller Pulse.' },
  { name: 'Bling', provider: 'BLING', description: 'ERP preparado para Seller Pulse.' },
  { name: 'Omie', provider: 'OMIE', description: 'ERP preparado para Seller Pulse.' },
  { name: 'Tiny', provider: 'TINY', description: 'ERP preparado para Seller Pulse.' },
];

const marketplaceOptions = [
  { label: 'Todos marketplaces', value: '' },
  { label: 'Mercado Livre', value: 'MERCADOLIVRE' },
  { label: 'Shopee', value: 'SHOPEE' },
  { label: 'Amazon', value: 'AMAZON' },
  { label: 'Bling', value: 'BLING' },
  { label: 'Omie', value: 'OMIE' },
  { label: 'Tiny', value: 'TINY' },
];

const statusOptions = [
  { label: 'Todos status', value: '' },
  { label: 'Conectado', value: 'CONNECTED' },
  { label: 'Desconectado', value: 'DISCONNECTED' },
  { label: 'Erro', value: 'ERROR' },
  { label: 'Pendente', value: 'PENDING' },
];

type PageMessage = {
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
};

type MercadoLivreConfig = {
  clientId: string;
  clientSecret: string;
  clientSecretConfigured?: boolean;
};

const defaultMercadoLivreConfig: MercadoLivreConfig = {
  clientId: '',
  clientSecret: '',
  clientSecretConfigured: false,
};

function formatDate(value?: string | null) {
  if (!value) return 'Ainda nao sincronizado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function Integrations() {
  const { values, setValue, clear } = useListQuery();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [mercadoLivreConfig, setMercadoLivreConfig] =
    useState<MercadoLivreConfig>(defaultMercadoLivreConfig);
  const [message, setMessage] = useState<PageMessage | null>(null);
  const integrationParams = useMemo(
    () => ({
      marketplace: values.marketplace || undefined,
      status: statusOptions.some((option) => option.value === values.status)
        ? values.status
        : undefined,
    }),
    [values.marketplace, values.status],
  );

  const handleRequestError = (error: unknown, fallback: string) => {
    const axiosError = error as AxiosError<{ message?: string }>;
    const status = axiosError.response?.status;
    const detail = axiosError.response?.data?.message;

    if (status === 401) {
      localStorage.removeItem('token');
      setMessage({ type: 'error', text: 'Sessao expirada. Entre novamente.' });
      window.setTimeout(() => window.location.assign('/login'), 800);
      return;
    }

    if (!axiosError.response) {
      setMessage({
        type: 'error',
        text: 'Nao foi possivel conectar com a API. Confirme se o backend esta rodando na porta 4041.',
      });
      return;
    }

    setMessage({ type: 'error', text: detail || fallback });
  };

  const loadIntegrations = async () => {
    try {
      const { data } = await api.get('/integrations', { params: integrationParams });
      setIntegrations(data);
    } catch (error) {
      handleRequestError(error, 'Nao foi possivel carregar as integracoes.');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const provider = params.get('provider');

    if (provider === 'mercadolivre' && status === 'syncing') {
      setMessage({
        type: 'info',
        text: 'Mercado Livre conectado. A primeira sincronizacao comecou automaticamente.',
      });
      window.history.replaceState(null, '', '/integrations');
    }

    if (provider === 'mercadolivre' && status === 'error') {
      setMessage({
        type: 'error',
        text: params.get('reason') || 'Nao foi possivel conectar o Mercado Livre.',
      });
      window.history.replaceState(null, '', '/integrations');
    }

    if (params.get('connected') === 'mercadolivre') {
      setMessage({ type: 'success', text: 'Mercado Livre conectado com sucesso.' });
      window.history.replaceState(null, '', '/integrations');
    }

    if (params.get('error') === 'mercadolivre') {
      setMessage({
        type: 'error',
        text: 'Nao foi possivel conectar o Mercado Livre. Tente novamente.',
      });
      window.history.replaceState(null, '', '/integrations');
    }

    loadIntegrations().finally(() => setLoading(false));
  }, [integrationParams]);

  const ml = integrations.find((x) => x.provider === 'MERCADOLIVRE');
  const mlMetadata = (ml?.metadata || {}) as Record<string, string>;
  const visibleApps = apps.filter((app) => {
    if (values.marketplace && values.marketplace !== app.provider) return false;
    if (!values.status) return true;
    const integration = integrations.find((item) => item.provider === app.provider);
    return integration?.status === values.status;
  });

  const mlState = useMemo(() => {
    if (!ml || ml.status !== 'CONNECTED') {
      return { label: 'Disponivel', color: 'default' as const, helper: 'Pronto para conectar.' };
    }
    if (ml.syncStatus === 'SYNCING') {
      return { label: 'Sincronizando', color: 'info' as const, helper: 'Sincronizando dados...' };
    }
    if (ml.syncStatus === 'COMPLETED') {
      return { label: 'Sincronizado', color: 'success' as const, helper: 'Dados atualizados.' };
    }
    if (ml.syncStatus === 'PARTIAL') {
      return {
        label: 'Parcial',
        color: 'warning' as const,
        helper: 'Conectado, mas parte da sincronizacao falhou.',
      };
    }
    if (ml.syncStatus === 'ERROR') {
      return {
        label: 'Erro de sync',
        color: 'error' as const,
        helper: 'Conectado, mas houve erro na sincronizacao.',
      };
    }
    return { label: 'Conectado', color: 'success' as const, helper: 'Aguardando sincronizacao.' };
  }, [ml]);

  useEffect(() => {
    if (ml?.syncStatus !== 'SYNCING') return;

    const interval = window.setInterval(() => {
      loadIntegrations();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [ml?.syncStatus]);

  const connect = async () => {
    setConnecting(true);
    try {
      const { data } = await api.get('/integrations/mercadolivre/connect');
      window.location.assign(data.authorizationUrl || data.url);
    } catch (error) {
      setConnecting(false);
      handleRequestError(error, 'Nao foi possivel iniciar a conexao.');
    }
  };

  const openMercadoLivreConfig = async () => {
    setConfigOpen(true);
    setConfigLoading(true);
    try {
      const { data } = await api.get('/integrations/mercadolivre/config');
      setMercadoLivreConfig({
        ...defaultMercadoLivreConfig,
        ...data,
        clientSecret: '',
      });
    } catch (error) {
      handleRequestError(error, 'Nao foi possivel carregar a configuracao.');
    } finally {
      setConfigLoading(false);
    }
  };

  const saveMercadoLivreConfig = async () => {
    setConfigSaving(true);
    try {
      const { data } = await api.put('/integrations/mercadolivre/config', mercadoLivreConfig);
      setMercadoLivreConfig({
        ...defaultMercadoLivreConfig,
        ...data,
        clientSecret: '',
      });
      setMessage({ type: 'success', text: 'Configuracao do Mercado Livre salva.' });
      setConfigOpen(false);
    } catch (error) {
      handleRequestError(error, 'Nao foi possivel salvar a configuracao.');
    } finally {
      setConfigSaving(false);
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      await api.post('/integrations/mercadolivre/sync');
      await loadIntegrations();
      setMessage({ type: 'success', text: 'Sincronizacao executada.' });
    } catch (error) {
      handleRequestError(error, 'Nao foi possivel sincronizar agora.');
    } finally {
      setSyncing(false);
    }
  };

  const disconnect = async () => {
    try {
      await api.post('/integrations/mercadolivre/disconnect');
      await loadIntegrations();
      setMessage({ type: 'success', text: 'Mercado Livre desconectado.' });
    } catch (error) {
      handleRequestError(error, 'Nao foi possivel desconectar o Mercado Livre.');
    }
  };

  return (
    <Shell>
      <div className="page">
        <Stack spacing={0.5} sx={{ mb: 3.5 }}>
          <Typography variant="h4" fontWeight={600}>
            Integracoes
          </Typography>
          <Typography className="muted">Conecte seus canais e centralize a operacao.</Typography>
        </Stack>

        <ListFilters
          fields={[
            {
              name: 'marketplace',
              label: 'Marketplace',
              type: 'select',
              options: marketplaceOptions,
            },
            { name: 'status', label: 'Status', type: 'select', options: statusOptions },
          ]}
          values={values}
          loading={loading}
          hasActiveFilters={hasFilters(values)}
          onChange={setValue}
          onManyChange={() => undefined}
          onClear={clear}
        />

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
          {visibleApps.map((app) => {
            const isMl = app.provider === 'MERCADOLIVRE';
            const connected = isMl && ml?.status === 'CONNECTED';
            const chip = isMl
              ? mlState
              : { label: 'Em breve', color: 'default' as const, helper: 'Disponivel em breve.' };

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
                    minHeight: 252,
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
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {isMl && (
                        <Tooltip title="Configurar Mercado Livre">
                          <IconButton
                            size="small"
                            aria-label="Configurar Mercado Livre"
                            onClick={openMercadoLivreConfig}
                          >
                            <SettingsOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Chip
                        size="small"
                        label={chip.label}
                        color={chip.color}
                        variant={connected ? 'filled' : 'outlined'}
                      />
                    </Stack>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {app.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      className="muted"
                      sx={{ mt: 0.5, lineHeight: 1.45 }}
                    >
                      {app.description}
                    </Typography>

                    {isMl && connected && (
                      <Stack spacing={0.4} sx={{ mt: 1.5 }}>
                        <Typography variant="caption" className="muted">
                          {chip.helper}
                        </Typography>
                        <Typography variant="caption" className="muted">
                          Nickname: {mlMetadata.nickname || 'Nao informado'}
                        </Typography>
                        <Typography variant="caption" className="muted">
                          Seller ID: {ml.externalAccountId || 'Nao informado'}
                        </Typography>
                        <Typography variant="caption" className="muted">
                          Ultima sincronizacao: {formatDate(ml.lastSyncAt)}
                        </Typography>
                        {ml.lastSyncError && (
                          <Typography variant="caption" color="error">
                            {ml.lastSyncError}
                          </Typography>
                        )}
                      </Stack>
                    )}
                  </Box>
                  <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Divider sx={{ mb: 1.5 }} />
                    {isMl ? (
                      connected ? (
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Button
                            size="small"
                            startIcon={
                              syncing || ml?.syncStatus === 'SYNCING' ? (
                                <CircularProgress size={14} />
                              ) : (
                                <CloudSyncOutlined />
                              )
                            }
                            disabled={syncing || ml?.syncStatus === 'SYNCING'}
                            onClick={sync}
                          >
                            Sincronizar agora
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            disabled={ml?.syncStatus === 'SYNCING'}
                            onClick={disconnect}
                          >
                            Desconectar
                          </Button>
                        </Stack>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={connecting ? <CircularProgress size={14} /> : <LinkOutlined />}
                          disabled={connecting}
                          onClick={connect}
                        >
                          Conectar
                        </Button>
                      )
                    ) : (
                      <Typography variant="caption" className="muted">
                        Disponivel em breve
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

        <Dialog open={configOpen} onClose={() => setConfigOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Configurar Mercado Livre</DialogTitle>
          <DialogContent>
            {configLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Stack spacing={2} sx={{ pt: 1 }}>
                <TextField
                  label="Client ID"
                  value={mercadoLivreConfig.clientId}
                  onChange={(event) =>
                    setMercadoLivreConfig((current) => ({
                      ...current,
                      clientId: event.target.value,
                    }))
                  }
                  fullWidth
                />
                <TextField
                  label="Client Secret"
                  type="password"
                  value={mercadoLivreConfig.clientSecret}
                  onChange={(event) =>
                    setMercadoLivreConfig((current) => ({
                      ...current,
                      clientSecret: event.target.value,
                    }))
                  }
                  helperText={
                    mercadoLivreConfig.clientSecretConfigured
                      ? 'Ja existe um secret salvo. Deixe em branco para manter.'
                      : 'Informe o secret do aplicativo Mercado Livre.'
                  }
                  fullWidth
                />
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setConfigOpen(false)}>Cancelar</Button>
            <Button
              variant="contained"
              startIcon={configSaving ? <CircularProgress size={14} /> : <SaveOutlined />}
              disabled={configLoading || configSaving}
              onClick={saveMercadoLivreConfig}
            >
              Salvar
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={!!message}
          autoHideDuration={6000}
          onClose={() => setMessage(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {message ? (
            <Alert severity={message.type} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          ) : undefined}
        </Snackbar>
      </div>
    </Shell>
  );
}
