# Setup do Admin

## 1) Variaveis obrigatorias

```env
JWT_SECRET=troque-por-um-valor-forte
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SEU_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=SEU_SERVICE_ROLE_KEY
```

## 2) Fallback opcional (sem Supabase de usuarios)

```env
ADMIN_FALLBACK_USERNAME=admin
ADMIN_FALLBACK_PASSWORD=senha-forte
ADMIN_FALLBACK_ID=fallback-admin
```

Em producao, o fallback so funciona se voce habilitar explicitamente:

```env
ALLOW_FALLBACK_ADMIN=true
```

## 3) Fluxo de operacao

1. Faca login em `/login`.
2. Acesse `/admin`.
3. Gerencie usuarios, monitore logs e execute limpeza de dados.

## 4) Observacoes

- Sem `JWT_SECRET`, as rotas autenticadas retornam `503` com codigo `JWT_SECRET_NOT_CONFIGURED`.
- Sem config de Supabase service role, `/api/db/stats` e `/api/db/clear` retornam `503` com codigo `SUPABASE_NOT_CONFIGURED`.
