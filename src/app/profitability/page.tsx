'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CircularProgress, Typography } from '@mui/material';
import Shell from '@/components/Shell';
import { LabelWithInfo } from '@/components/InfoHint';
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

const marginOptions = [
  { label: 'Todas margens', value: '' },
  { label: 'Margem baixa', value: 'low' },
  { label: 'Margem saudavel', value: 'healthy' },
];

const profitOptions = [
  { label: 'Lucro e prejuízo', value: '' },
  { label: 'Com lucro', value: 'positive' },
  { label: 'Com prejuízo', value: 'negative' },
];

export default function Profitability() {
  const { values, setValue, setMany, clear } = useListQuery();
  const [dashboard, setDashboard] = useState<any>();
  const [loading, setLoading] = useState(true);
  const params = useMemo(() => ({ limit: 20, ...values }), [values]);

  useEffect(() => {
    setLoading(true);
    api
      .get('/analytics/dashboard', { params })
      .then((response) => setDashboard(response.data))
      .finally(() => setLoading(false));
  }, [params]);

  const productsPayload = dashboard?.topProducts;
  const rows = Array.isArray(productsPayload) ? productsPayload : productsPayload?.items || [];
  const pagination: PaginationMeta | undefined = Array.isArray(productsPayload)
    ? undefined
    : productsPayload?.pagination;

  return (
    <Shell>
      <div className="page">
        <Typography variant="h4" fontWeight={600} mb={3}>
          Rentabilidade
        </Typography>

        <ListFilters
          fields={[
            {
              name: 'product',
              label: 'Produto/SKU',
              type: 'search',
              placeholder: 'Buscar produto ou SKU...',
            },
            {
              name: 'marketplace',
              label: 'Marketplace',
              type: 'select',
              options: marketplaceOptions,
            },
            { name: 'margin', label: 'Margem', type: 'select', options: marginOptions },
            { name: 'profit', label: 'Resultado', type: 'select', options: profitOptions },
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

        <Card>
          <CardContent>
            {loading && !dashboard ? (
              <CircularProgress />
            ) : rows.length === 0 ? (
              <Typography className="muted">Nenhum produto encontrado no periodo.</Typography>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>SKU</th>
                    <th>Vendas</th>
                    <th>
                      <LabelWithInfo
                        label="Faturamento"
                        info="Soma do valor bruto vendido por este produto no periodo filtrado."
                      />
                    </th>
                    <th>
                      <LabelWithInfo
                        label="Lucro"
                        info="Soma do lucro estimado dos itens deste produto: receita menos taxas, frete, custos, descontos e impostos estimados."
                      />
                    </th>
                    <th>
                      <LabelWithInfo
                        label="Margem"
                        info="Lucro estimado dividido pelo faturamento do produto no periodo."
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((product: any) => (
                    <tr key={product.id || product.sku}>
                      <td>{product.name}</td>
                      <td>{product.sku}</td>
                      <td>{product.quantity}</td>
                      <td>{money(product.revenue)}</td>
                      <td className={Number(product.profit) < 0 ? 'negative' : 'positive'}>
                        {money(product.profit)}
                      </td>
                      <td>{product.margin.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <ResultsPagination
              pagination={pagination}
              onPageChange={(page) => setValue('page', String(page))}
            />
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
