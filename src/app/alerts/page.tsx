'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, Chip, Typography } from '@mui/material';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
export default function Alerts() {
  const [a, setA] = useState<any[]>([]);
  useEffect(() => {
    api.get('/alerts').then((r) => setA(r.data));
  }, []);
  return (
    <Shell>
      <div className="page">
        <Typography variant="h4" fontWeight={800} mb={3}>
          Alertas
        </Typography>
        {a.map((x) => (
          <Card key={x.id} sx={{ mb: 1 }}>
            <CardContent>
              <Chip
                size="small"
                label={x.severity}
                color={x.severity === 'warning' ? 'warning' : 'success'}
              />
              <Typography fontWeight={700} mt={1}>
                {x.title}
              </Typography>
              <Typography className="muted">{x.description}</Typography>
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  );
}
