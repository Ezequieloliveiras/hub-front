'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import Shell from '@/components/Shell';
import {
  hasFilters,
  ListFilters,
  periodOptions,
  ResultsPagination,
  useListQuery,
  type PaginationMeta,
} from '@/components/ListControls';
import { api } from '@/lib/api';

const marketplaceOptions = [
  { label: 'Todos marketplaces', value: '' },
  { label: 'Mercado Livre', value: 'MERCADOLIVRE' },
  { label: 'Shopee', value: 'SHOPEE' },
  { label: 'Amazon', value: 'AMAZON' },
];

const severityOptions = [
  { label: 'Todas severidades', value: '' },
  { label: 'Info', value: 'info' },
  { label: 'Sucesso', value: 'success' },
  { label: 'Atencao', value: 'warning' },
  { label: 'Critico', value: 'critical' },
];

const statusOptions = [
  { label: 'Todos status', value: '' },
  { label: 'Nao lidos', value: 'unread' },
  { label: 'Lidos', value: 'read' },
];

const typeOptions = [
  { label: 'Todos tipos', value: '' },
  { label: 'Produto sem lucro', value: 'UNPROFITABLE_PRODUCT' },
  { label: 'Margem baixa', value: 'LOW_MARGIN' },
];

export default function Alerts() {
  const { values, setValue, setMany, clear } = useListQuery();
  const [data, setData] = useState<{ items: any[]; pagination?: PaginationMeta }>();
  const [loading, setLoading] = useState(true);
  const params = useMemo(() => ({ limit: 20, ...values }), [values]);

  useEffect(() => {
    setLoading(true);
    api
      .get('/alerts', { params })
      .then((response) => {
        const payload = Array.isArray(response.data)
          ? { items: response.data, pagination: undefined }
          : response.data;
        setData(payload);
      })
      .finally(() => setLoading(false));
  }, [params]);

  const items = data?.items || [];

  return (
    <Shell>
      <div className="page">
        <Typography variant="h4" fontWeight={800} mb={3}>
          Alertas
        </Typography>

        <ListFilters
          fields={[
            {
              name: 'search',
              label: 'Buscar',
              type: 'search',
              placeholder: 'Buscar alerta, produto, SKU...',
            },
            {
              name: 'marketplace',
              label: 'Marketplace',
              type: 'select',
              options: marketplaceOptions,
            },
            { name: 'type', label: 'Tipo', type: 'select', options: typeOptions },
            { name: 'severity', label: 'Severidade', type: 'select', options: severityOptions },
            { name: 'status', label: 'Status', type: 'select', options: statusOptions },
            { name: 'dateFrom', label: 'De', type: 'date', minWidth: 140 },
            { name: 'dateTo', label: 'Ate', type: 'date', minWidth: 140 },
          ]}
          periodPresets={periodOptions}
          values={values}
          loading={loading}
          hasActiveFilters={hasFilters(values)}
          onChange={setValue}
          onManyChange={setMany}
          onClear={clear}
        />

        {loading && !data ? (
          <CircularProgress />
        ) : items.length === 0 ? (
          <Card>
            <CardContent>
              <Typography className="muted">Nenhum alerta encontrado.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={1}>
            {items.map((alert) => (
              <Card key={alert.id}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Chip
                      size="small"
                      label={alert.severity}
                      color={severityColor(alert.severity)}
                    />
                    <Chip
                      size="small"
                      label={alert.isRead ? 'Lido' : 'Nao lido'}
                      variant="outlined"
                    />
                    <Typography className="muted" variant="caption">
                      {new Date(alert.createdAt).toLocaleString('pt-BR')}
                    </Typography>
                  </Stack>
                  <Typography fontWeight={700} mt={1}>
                    {alert.title}
                  </Typography>
                  <Typography className="muted">{alert.description}</Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
        <ResultsPagination
          pagination={data?.pagination}
          onPageChange={(page) => setValue('page', String(page))}
        />
      </div>
    </Shell>
  );
}

function severityColor(value: string) {
  if (value === 'critical') return 'error';
  if (value === 'warning') return 'warning';
  if (value === 'success') return 'success';
  return 'info';
}
