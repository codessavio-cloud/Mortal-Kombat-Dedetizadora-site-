# Mortal Kombat Dedetizadora

Sistema interno de calculo de orcamentos para servicos de controle de pragas.

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- Supabase (usuarios, logs, orcamentos)
- JWT + cookie httpOnly para sessao

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run check
npm test
npm run security:test
```

`npm run security:test` sobe um servidor local temporario, executa os checks e encerra automaticamente.

## Variaveis de ambiente

Obrigatoria para autenticacao:

```env
JWT_SECRET=troque-por-um-valor-forte
```

Supabase (recomendado):

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SEU_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=SEU_SERVICE_ROLE_KEY
```

Fallback administrativo opcional (emergencia):

```env
ADMIN_FALLBACK_USERNAME=admin
ADMIN_FALLBACK_PASSWORD=senha-forte
ADMIN_FALLBACK_ID=fallback-admin
```

Producao: para permitir fallback admin sem Supabase, habilite explicitamente:

```env
ALLOW_FALLBACK_ADMIN=true
```

Se `NODE_ENV=production` e `ALLOW_FALLBACK_ADMIN` nao estiver `true`, o fallback admin e bloqueado por seguranca.

## APIs canonicas

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET|POST /api/users`
- `PATCH|DELETE /api/users/[id]`
- `GET|POST /api/activity`
- `GET /api/db/stats`
- `POST /api/db/clear`

## Contratos principais

`GET /api/activity` suporta:

- `limit` (1..100)
- `cursor` (baseado em `created_at` + `id`)
- `username` (opcional)
- `type` (`todos|login|calculo|copia|navegacao|usuario|limpeza`)
- `search` (opcional)
- `includeStats` (`true|false`)

Resposta:

```json
{
  "logs": [],
  "nextCursor": null,
  "stats": {
    "totalLogs": 0,
    "todayLogs": 0,
    "loginCount": 0,
    "calculoCount": 0,
    "copiaCount": 0,
    "navegacaoCount": 0
  }
}
```

`GET /api/users` suporta paginacao opcional:

- `page`
- `pageSize`
- `search`
- `activeOnly`

Resposta inclui `users` e metadados (`page`, `pageSize`, `total`, `totalPages`, `hasNextPage`, `hasPrevPage`).

## Notas de seguranca

- Senhas sao armazenadas com hash `scrypt`.
- Registros legados em texto puro sao migrados para hash no primeiro login valido.
- `X-Request-Id` e aplicado nas respostas de API para correlacao ponta a ponta.
- Sem configuracao de Supabase service role, as rotas de banco retornam `503` com `code: "SUPABASE_NOT_CONFIGURED"`.
- Indices SQL recomendados estao em `supabase/indexes.sql`.

## Estrutura principal

```text
app/
  api/
  admin/
  login/
  ...paginas de calculo
components/
  admin/
  activity-tracker.tsx
  ui/
    button.tsx
    input.tsx
    label.tsx
hooks/
  admin/
lib/
  admin/
  api/
  auth/
  security/
  supabase/
  utils.ts
```
