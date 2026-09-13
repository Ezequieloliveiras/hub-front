'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Shell from '@/components/Shell';
import { LabelWithInfo } from '@/components/InfoHint';
import { api, money } from '@/lib/api';

const labels: { [key: string]: string } = {
  revenue: 'Faturamento',
  profit: 'Lucro estimado',
  margin: 'Margem media',
  orders: 'Pedidos',
  productsSold: 'Produtos vendidos',
  ticket: 'Ticket medio',
  fees: 'Taxas',
  cost: 'Custo dos produtos',
};

const kpiInfo: { [key: string]: string } = {
  revenue: 'Soma do valor bruto dos pedidos no periodo filtrado.',
  profit:
    'Receita bruta menos taxas do marketplace, frete, descontos, custo dos produtos e impostos estimados.',
  margin: 'Lucro estimado dividido pelo faturamento bruto do periodo.',
  orders: 'Quantidade de pedidos sincronizados no periodo filtrado.',
  productsSold: 'Soma das quantidades vendidas nos itens dos pedidos do periodo.',
  ticket: 'Faturamento bruto dividido pela quantidade de pedidos do periodo.',
  fees: 'Soma das taxas cobradas pelos marketplaces nos pedidos do periodo.',
  cost: 'Soma do custo dos produtos vendidos nos pedidos do periodo.',
};

export default function Dashboard() {
  const [dashboard, setDashboard] = useState<any>();
  const [period, setPeriod] = useState('7');
  const [marketplace, setMarketplace] = useState('MERCADOLIVRE');
  const dateParams = useMemo(() => periodDateParams(Number(period)), [period]);

  useEffect(() => {
    setDashboard(undefined);
    api
      .get('/analytics/dashboard', {
        params: {
          ...dateParams,
          ...(marketplace ? { marketplace } : {}),
        },
      })
      .then((response) => setDashboard(response.data))
      .catch(() => setDashboard(null));
  }, [dateParams, marketplace]);

  const topProducts = Array.isArray(dashboard?.topProducts)
    ? dashboard.topProducts
    : dashboard?.topProducts?.items || [];

  return (
    <Shell>
      <div className="page">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={800}>
              Visao geral
            </Typography>
            <Typography className="muted">Acompanhe o pulso da sua operacao.</Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Select
              size="small"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              sx={{ height: 40 }}
            >
              <MenuItem value="7">Ultimos 7 dias</MenuItem>
              <MenuItem value="30">Ultimos 30 dias</MenuItem>
            </Select>
            <Select
              size="small"
              value={marketplace}
              onChange={(event) => setMarketplace(event.target.value)}
              sx={{ height: 40, minWidth: 150 }}
            >
              <MenuItem value="">Todos marketplaces</MenuItem>
              <MenuItem value="MERCADOLIVRE">Mercado Livre</MenuItem>
              <MenuItem value="SHOPEE">Shopee</MenuItem>
              <MenuItem value="AMAZON">Amazon</MenuItem>
            </Select>
          </Stack>
        </Box>

        {dashboard === undefined ? (
          <Skeleton height={360} />
        ) : !dashboard ? (
          <Alert severity="info">
            Conecte seu primeiro marketplace ou use a conta demo para ver seus indicadores.
          </Alert>
        ) : (
          <>
            <div className="grid kpis">
              {Object.entries(labels).map(([key, label]) => (
                <Card className="card" key={key}>
                  <CardContent>
                    <Typography className="muted" variant="body2" component="div">
                      <LabelWithInfo label={label} info={kpiInfo[key]} />
                    </Typography>
                    <Typography variant="h6" fontWeight={750}>
                      {formatKpiValue(key, dashboard.kpis[key])}
                    </Typography>
                    <KpiTrend value={dashboard.comparison?.[key]} />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="card" sx={{ mt: 3 }}>
              <CardContent>
                <Typography fontWeight={700} component="div">
                  <LabelWithInfo
                    label="Evolucao de faturamento"
                    info="Serie temporal da receita bruta dos pedidos, agrupada por dia dentro do periodo filtrado."
                  />
                </Typography>
                <Box height={270}>
                  <ResponsiveContainer>
                    <LineChart data={dashboard.series}>
                      <XAxis dataKey="date" hide />
                      <YAxis />
                      <Tooltip formatter={(value) => money(Number(value))} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>

            <Box className="grid" sx={{ gridTemplateColumns: { md: '1fr 1fr' }, mt: 3 }}>
              <ProductList title="Produtos mais lucrativos" rows={topProducts} />
              <ProductList title="Produtos com margem baixa" rows={dashboard.lowMargin} />
            </Box>
          </>
        )}
      </div>
    </Shell>
  );
}

function formatKpiValue(key: string, value: number) {
  if (key === 'margin') return `${Number(value || 0).toFixed(1)}%`;
  if (key === 'orders' || key === 'productsSold') return value || 0;
  return money(value);
}

function KpiTrend({ value }: { value?: number | null }) {
  if (value === undefined || value === null) {
    return (
      <Typography className="muted" variant="caption">
        Sem periodo anterior
      </Typography>
    );
  }

  const className = value > 0 ? 'positive' : value < 0 ? 'negative' : 'muted';
  const prefix = value > 0 ? '+' : '';

  return (
    <Typography className={className} variant="caption">
      {prefix}
      {value.toFixed(1)}% vs. periodo anterior
    </Typography>
  );
}

function periodDateParams(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - Math.max(1, days) + 1);

  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
  };
}

function ProductList({ title, rows }: { title: string; rows: any[] }) {
  return (
    <Card className="card">
      <CardContent>
        <Typography fontWeight={700} mb={1}>
          {title}
        </Typography>
        {rows.length ? (
          rows.map((item) => (
            <Box
              key={item.sku}
              sx={{
                py: 1.3,
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Box>
                <Typography fontSize={14} fontWeight={600}>
                  {item.name}
                </Typography>
                <Typography className="muted" variant="caption">
                  {item.sku} - {item.quantity} vendas
                </Typography>
              </Box>
              <Chip
                size="small"
                label={`${item.margin.toFixed(1)}%`}
                color={item.margin < 10 ? 'warning' : 'success'}
              />
            </Box>
          ))
        ) : (
          <Typography className="muted">Nenhum produto nesta categoria.</Typography>
        )}
      </CardContent>
    </Card>
  );
}
