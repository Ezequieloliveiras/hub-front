'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import Shell from '@/components/Shell';
import { hasFilters, ListFilters, periodOptions, useListQuery } from '@/components/ListControls';
import { api, money } from '@/lib/api';

const marketplaceOptions = [
  { label: 'Todos marketplaces', value: '' },
  { label: 'Mercado Livre', value: 'MERCADOLIVRE' },
  { label: 'Shopee', value: 'SHOPEE' },
  { label: 'Amazon', value: 'AMAZON' },
];

const groupOptions = [
  { label: 'Diario', value: 'daily' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'Mensal', value: 'monthly' },
];

export default function Dre() {
  const { values, setValue, setMany, clear } = useListQuery({ groupBy: 'daily' });
  const [dashboard, setDashboard] = useState<any>();
  const [loading, setLoading] = useState(true);
  const params = useMemo(() => values, [values]);

  useEffect(() => {
    setLoading(true);
    api
      .get('/analytics/dashboard', { params })
      .then((response) => setDashboard(response.data))
      .finally(() => setLoading(false));
  }, [params]);

  const k = dashboard?.kpis || {};
  const rows = [
    ['Receita bruta', k.revenue],
    ['(-) Taxas dos marketplaces', -Number(k.fees || 0)],
    ['(-) Custo dos produtos', -Number(k.cost || 0)],
    ['= Lucro estimado', k.profit],
  ];

  return (
    <Shell>
      <div className="page">
        <Typography variant="h4" fontWeight={800} mb={2}>
          DRE
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          DRE gerencial estimada - nao e um documento contabil oficial.
        </Alert>

        <ListFilters
          fields={[
            {
              name: 'marketplace',
              label: 'Marketplace',
              type: 'select',
              options: marketplaceOptions,
            },
            { name: 'groupBy', label: 'Agrupamento', type: 'select', options: groupOptions },
            { name: 'dateFrom', label: 'De', type: 'date', minWidth: 140 },
            { name: 'dateTo', label: 'Ate', type: 'date', minWidth: 140 },
          ]}
          periodPresets={periodOptions}
          values={values}
          loading={loading}
          hasActiveFilters={hasFilters(values, ['page', 'groupBy'])}
          onChange={setValue}
          onManyChange={setMany}
          onClear={clear}
        />

        <Card>
          <CardContent>
            {loading && !dashboard ? (
              <CircularProgress />
            ) : (
              rows.map(([label, value]: any) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '15px 5px',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <b>{label}</b>
                  <b>{money(value)}</b>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
