# Seller Pulse Web

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abra `http://localhost:3000`. A API deve estar em `http://localhost:4041/api`. A conta demo é `demo@sellerpulse.com` / `demo1234` após executar o seed da API.

Para OAuth em domínio público, a rota do front `/api/integrations/mercadolivre/callback` repassa o callback para `BACKEND_API_URL`.

# hub-front
