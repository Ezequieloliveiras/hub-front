'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, Chip, CircularProgress, Stack, Typography } from '@mui/material';
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
  { label: 'Em estoque', value: 'in' },
  { label: 'Estoque baixo', value: 'low' },
  { label: 'Sem estoque', value: 'out' },
  { label: 'Sem anuncio', value: 'unlisted' },
];

const sortOptions = [
  { label: 'Atualizacao', value: 'updatedAt' },
  { label: 'Nome', value: 'name' },
  { label: 'SKU', value: 'sku' },
  { label: 'Cadastro', value: 'createdAt' },
  { label: 'Custo', value: 'cost' },
];

export default function Products() {
  const { values, setValue, clear } = useListQuery();
  const [data, setData] = useState<{ items: any[]; pagination?: PaginationMeta }>();
  const [loading, setLoading] = useState(true);
  const params = useMemo(() => ({ limit: 20, ...values }), [values]);

  useEffect(() => {
    setLoading(true);
    api
      .get('/products', { params })
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
        <Typography variant="h4" fontWeight={600} mb={3}>
          Produtos
        </Typography>

        <ListFilters
          fields={[
            {
              name: 'search',
              label: 'Buscar',
              type: 'search',
              placeholder: 'Buscar nome, SKU, codigo do marketplace...',
            },
            {
              name: 'marketplace',
              label: 'Marketplace',
              type: 'select',
              options: marketplaceOptions,
            },
            { name: 'dateFrom', label: 'Cadastro de', type: 'date', minWidth: 150 },
            { name: 'dateTo', label: 'Cadastro ate', type: 'date', minWidth: 150 },
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
              <Typography className="muted">Nenhum produto encontrado.</Typography>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>SKU</th>
                    <th>
                      <LabelWithInfo
                        label="Custo"
                        info="Custo unitario cadastrado para o produto. Usado nos calculos de lucro e margem."
                      />
                    </th>
                    <th>Marketplace</th>
                    <th>Estoque</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((product) => {
                    const marketplaces = [
                      ...new Set(
                        (product.listings || []).map((listing: any) => listing.marketplace),
                      ),
                    ];
                    const stock = (product.listings || []).reduce(
                      (sum: number, listing: any) => sum + Number(listing.availableQuantity || 0),
                      0,
                    );

                    return (
                      <tr key={product.id}>
                        <td>
                          <Link href={`/products/${product.id}`}>
                            <b>{product.name}</b>
                          </Link>
                        </td>
                        <td>{product.sku}</td>
                        <td>{product.cost ? money(product.cost) : 'Nao informado'}</td>
                        <td>{marketplaces.length ? marketplaces.join(', ') : 'Sem anuncio'}</td>
                        <td>{stock}</td>
                        <td>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            <Chip
                              size="small"
                              label={product.active ? 'Ativo' : 'Inativo'}
                              color={product.active ? 'success' : 'default'}
                            />
                            {stock > 0 && stock <= 5 ? (
                              <Chip size="small" label="Estoque baixo" color="warning" />
                            ) : null}
                          </Stack>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
