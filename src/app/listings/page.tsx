'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { PostAdd, Sync } from '@mui/icons-material';
import Shell from '@/components/Shell';
import { LabelWithInfo } from '@/components/InfoHint';
import {
  hasFilters,
  ListFilters,
  ResultsPagination,
  useListQuery,
  type PaginationMeta,
} from '@/components/ListControls';
import { api, money } from '@/lib/api';

const marketplaceOptions = [
  { label: 'Todos marketplaces', value: '' },
  { label: 'Mercado Livre', value: 'MERCADOLIVRE' },
  { label: 'Shopee', value: 'SHOPEE' },
  { label: 'Amazon', value: 'AMAZON' },
];

const quickFilters = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativos', value: 'active' },
  { label: 'Pausados', value: 'paused' },
  { label: 'Encerrados', value: 'closed' },
  { label: 'Com erro', value: 'error' },
];

const sortOptions = [
  { label: 'Atualizacao', value: 'updatedAt' },
  { label: 'Sincronização', value: 'lastSyncedAt' },
  { label: 'Título', value: 'title' },
  { label: 'Preço', value: 'price' },
  { label: 'Estoque', value: 'availableQuantity' },
  { label: 'Criação', value: 'createdAt' },
];

export default function Listings() {
  const { values, setValue, clear } = useListQuery();
  const [data, setData] = useState<{ items: any[]; pagination?: PaginationMeta }>();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const params = useMemo(() => ({ limit: 20, ...values }), [values]);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get('/listings', { params });
      setData(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [params]);

  const sync = async () => {
    setSyncing(true);
    try {
      await api.post('/integrations/mercadolivre/sync');
      await load();
    } finally {
      setSyncing(false);
    }
  };

  const items = data?.items || [];

  return (
    <Shell>
      <div className="page">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={600}>
              Anúncios
            </Typography>
            <Typography className="muted">
              Acompanhe e gerencie seus anúncios nos marketplaces conectados.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              component={Link}
              href="/listings/create"
              startIcon={<PostAdd />}
            >
              Criar anúncio
            </Button>
            <Button
              variant="outlined"
              startIcon={syncing ? <CircularProgress size={16} /> : <Sync />}
              disabled={syncing}
              onClick={sync}
            >
              Sincronizar anúncios
            </Button>
          </Stack>
        </Box>

        <ListFilters
          fields={[
            {
              name: 'search',
              label: 'Buscar',
              type: 'search',
              placeholder: 'Buscar título, SKU, MLB, código Shopee...',
            },
            {
              name: 'marketplace',
              label: 'Marketplace',
              type: 'select',
              options: marketplaceOptions,
            },
            { name: 'dateFrom', label: 'De', type: 'date', minWidth: 140 },
            { name: 'dateTo', label: 'Ate', type: 'date', minWidth: 140 },
          ]}
          quickFilters={quickFilters}
          sortOptions={sortOptions}
          values={values}
          loading={loading}
          hasActiveFilters={hasFilters(values)}
          onChange={setValue}
          onManyChange={() => undefined}
          onClear={clear}
        />

        <Card>
          <CardContent>
            {items.length > 0 ? (
              <ResultsPagination
                pagination={data?.pagination}
                onPageChange={(page) => setValue('page', String(page))}
                position="top"
              />
            ) : null}
            {loading && !data ? (
              <CircularProgress />
            ) : items.length === 0 ? (
              <Typography className="muted">Nenhum anúncio encontrado.</Typography>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>ID</th>
                    <th>
                      <LabelWithInfo
                        label="Preço"
                        info="Preço atual do anúncio sincronizado do marketplace."
                      />
                    </th>
                    <th>Estoque</th>
                    <th>Status</th>
                    <th>Sincronizado</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any) => (
                    <tr key={item.id}>
                      <td>
                        <b>{item.title}</b>
                        <Typography className="muted" variant="caption" display="block">
                          {item.product?.sku || item.externalSku || '-'} · {item.marketplace}
                        </Typography>
                      </td>
                      <td>{item.externalId}</td>
                      <td>{money(Number(item.price))}</td>
                      <td>{item.availableQuantity}</td>
                      <td>
                        <Chip size="small" label={formatStatus(item.status)} />
                      </td>
                      <td>
                        <Typography variant="body2">
                          {formatDateTime(item.lastSyncedAt || item.createdAt)}
                        </Typography>
                        <Typography className="muted" variant="caption">
                          {item.lastSyncedAt ? 'Última sincronização' : 'Importado/criado'}
                        </Typography>
                      </td>
                      <td>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" component={Link} href={`/listings/${item.id}`}>
                            Detalhes
                          </Button>
                          {item.permalink && (
                            <Button
                              size="small"
                              href={item.permalink}
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

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    active: 'Ativo',
    paused: 'Pausado',
    closed: 'Encerrado',
  };
  return labels[status] || status;
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
