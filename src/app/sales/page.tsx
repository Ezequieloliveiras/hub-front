'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, Chip, CircularProgress, Typography } from '@mui/material';
import Shell from '@/components/Shell';
import {
  hasFilters,
  ListFilters,
  periodOptions,
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

const statusOptions = [
  { label: 'Todos status', value: '' },
  { label: 'Pago', value: 'paid' },
  { label: 'Confirmado', value: 'confirmed' },
  { label: 'Cancelado', value: 'cancelled' },
];

const sortOptions = [
  { label: 'Data', value: 'purchasedAt' },
  { label: 'Bruto', value: 'grossAmount' },
  { label: 'Lucro', value: 'estimatedProfit' },
  { label: 'Margem', value: 'marginPercentage' },
];

export default function Sales() {
  const { values, setValue, setMany, clear } = useListQuery();
  const [data, setData] = useState<{ items: any[]; pagination?: PaginationMeta }>();
  const [loading, setLoading] = useState(true);
  const params = useMemo(() => ({ limit: 20, ...values }), [values]);

  useEffect(() => {
    setLoading(true);
    api
      .get('/orders', { params })
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
          Vendas
        </Typography>

        <ListFilters
          fields={[
            {
              name: 'search',
              label: 'Buscar',
              type: 'search',
              placeholder: 'Pedido, produto, SKU ou cliente...',
            },
            {
              name: 'marketplace',
              label: 'Marketplace',
              type: 'select',
              options: marketplaceOptions,
            },
            { name: 'status', label: 'Status', type: 'select', options: statusOptions },
            { name: 'dateFrom', label: 'De', type: 'date', minWidth: 140 },
            { name: 'dateTo', label: 'Ate', type: 'date', minWidth: 140 },
          ]}
          periodPresets={periodOptions}
          sortOptions={sortOptions}
          values={values}
          loading={loading}
          hasActiveFilters={hasFilters(values)}
          onChange={setValue}
          onManyChange={setMany}
          onClear={clear}
        />

        <Card>
          <CardContent>
            {loading && !data ? (
              <CircularProgress />
            ) : items.length === 0 ? (
              <Typography className="muted">Nenhuma venda encontrada.</Typography>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Produto/SKU</th>
                    <th>Bruto</th>
                    <th>Taxas</th>
                    <th>Lucro</th>
                    <th>Margem</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.externalId}</td>
                      <td>{new Date(order.purchasedAt).toLocaleDateString('pt-BR')}</td>
                      <td>{order.buyerName || '-'}</td>
                      <td>
                        <Typography variant="body2">{order.items?.[0]?.title || '-'}</Typography>
                        <Typography className="muted" variant="caption">
                          {order.items?.[0]?.sku || '-'}
                        </Typography>
                      </td>
                      <td>{money(order.grossAmount)}</td>
                      <td>{money(order.marketplaceFee)}</td>
                      <td className={Number(order.estimatedProfit) < 0 ? 'negative' : 'positive'}>
                        {money(order.estimatedProfit)}
                      </td>
                      <td>{Number(order.marginPercentage).toFixed(1)}%</td>
                      <td>
                        <Chip size="small" label={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <ResultsPagination
              pagination={data?.pagination}
              onPageChange={(page) => setValue('page', String(page))}
            />
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
