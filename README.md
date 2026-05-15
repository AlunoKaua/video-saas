# Video SaaS

SaaS para download de vídeos permitidos pelo usuário, com 5 downloads grátis para novas contas e compra de créditos via Stripe.

Use apenas com vídeos próprios, licenciados ou para os quais você tenha permissão de download.

## Stack

- Next.js + TypeScript + Tailwind CSS
- PostgreSQL + Prisma
- NextAuth com credenciais e Google OAuth
- Stripe Checkout e webhook
- FastAPI + pytubefix para o serviço interno de download

## Configuração

1. Instale as dependências Node:

```bash
npm install
```

2. Crie o arquivo `.env` a partir de `.env.example` e preencha as variáveis.

3. Suba um banco PostgreSQL e configure `DATABASE_URL`.

4. Gere o Prisma Client e rode a migração local:

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Instale as dependências Python do downloader:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r services/downloader/requirements.txt
```

## Desenvolvimento

Em um terminal, rode o serviço Python interno:

```bash
INTERNAL_API_TOKEN="change-me-internal-token" uvicorn services.downloader.main:app --reload --port 8001
```

Em outro terminal, rode o app Next.js:

```bash
npm run dev
```

## Deploy gratuito: Vercel + Neon + Render

A configuração recomendada para o MVP gratuito é:

- Vercel para o app Next.js.
- Neon para PostgreSQL.
- Render para o serviço Python downloader.

### 1. Neon PostgreSQL

1. Crie um projeto no Neon.
2. Copie a connection string do banco com SSL.
3. Configure `DATABASE_URL` localmente apontando para o Neon:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require"
```

4. Aplique as migrations de produção:

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
```

Use `prisma:migrate` apenas em desenvolvimento local. Em produção, use `prisma:migrate:deploy`.

### 2. Render downloader

O arquivo `render.yaml` define o serviço Python.

Configuração equivalente no painel do Render:

```txt
Runtime: Python
Build Command: pip install -r services/downloader/requirements.txt
Start Command: uvicorn services.downloader.main:app --host 0.0.0.0 --port $PORT
```

Configure a variável no Render:

```env
INTERNAL_API_TOKEN="mesmo-token-usado-na-vercel"
```

Depois do deploy, copie a URL pública do serviço, por exemplo:

```txt
https://seu-servico.onrender.com
```

Essa URL será usada na Vercel como `DOWNLOADER_SERVICE_URL`.

### 3. Vercel Next.js

Com a Vercel CLI:

```bash
npm i -g vercel
vercel login
vercel link
```

Configure as variáveis de produção:

```bash
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add STRIPE_SUBSCRIPTION_PRICE_ID production
vercel env add DOWNLOADER_SERVICE_URL production
vercel env add INTERNAL_API_TOKEN production
```

Valores importantes:

```env
NEXTAUTH_URL="https://seu-app.vercel.app"
DOWNLOADER_SERVICE_URL="https://seu-servico.onrender.com"
INTERNAL_API_TOKEN="mesmo-token-usado-no-render"
STRIPE_SUBSCRIPTION_PRICE_ID="price_..."
```

Publique em produção:

```bash
vercel --prod
```

### Limitação do MVP no Render gratuito

O downloader salva os arquivos MP4 no disco temporário da instância Render. No plano gratuito, esses arquivos podem desaparecer após restart, redeploy, reciclagem da instância ou cold start.

Isso é aceitável para um MVP, mas não é armazenamento durável. Para produção real, use object storage como S3, R2, Supabase Storage ou equivalente.

## Google OAuth

Configure `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no `.env`.

No Google Cloud Console, crie um OAuth Client ID do tipo Web application e adicione o callback autorizado local:

```txt
http://localhost:3000/api/auth/callback/google
```

Em produção, adicione também o callback do domínio publicado:

```txt
https://seu-app.vercel.app/api/auth/callback/google
```

Garanta que `NEXTAUTH_URL` corresponda à URL base do ambiente.

## Stripe

Configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `STRIPE_SUBSCRIPTION_PRICE_ID` no `.env`.

Use um ID de preço que começa com `price_`; IDs de produto `prod_` não funcionam como preço de checkout.

Webhook local ou produção:

```txt
https://seu-app.vercel.app/api/stripe/webhook
```

O produto cobra R$10,00 em BRL e libera acesso conforme o fluxo validado pelo webhook.

## Verificação

Antes de publicar:

```bash
npm run lint
npm run typecheck
npm run build
npm run prisma:generate
python -m py_compile services/downloader/main.py
```

Depois do deploy do Render:

```bash
curl https://seu-servico.onrender.com/docs
```

A rota de metadata sem token deve retornar 401:

```bash
curl -i -X POST https://seu-servico.onrender.com/metadata \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

Com token interno, deve retornar metadata ou um erro controlado do provedor:

```bash
curl -i -X POST https://seu-servico.onrender.com/metadata \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <INTERNAL_API_TOKEN>" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```
