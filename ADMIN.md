# Sistema Administrativo

Este painel administra usuarios, senhas, logs e limpeza de dados.

## Credenciais

Nao existem credenciais fixas no codigo.

Opcoes de autenticacao:

1. Principal (recomendado): tabela `users` no Supabase.
2. Fallback de emergencia: variaveis de ambiente:
   - `ADMIN_FALLBACK_USERNAME`
   - `ADMIN_FALLBACK_PASSWORD`
   - opcional: `ADMIN_FALLBACK_ID`

Producao:

- fallback admin e bloqueado por padrao.
- para habilitar fallback em producao, configure `ALLOW_FALLBACK_ADMIN=true`.

## Requisitos Minimos de Ambiente

- `JWT_SECRET` (obrigatorio para autenticar sessao)
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (operacoes com banco via app)
- `SUPABASE_SERVICE_ROLE_KEY` (rotas administrativas de estatisticas/limpeza)

## Rotas Canonicas

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/users`
- `/api/users/[id]`
- `/api/activity`
- `/api/db/stats`
- `/api/db/clear`

## Notas de Seguranca

- Senhas sao armazenadas com hash `scrypt`.
- Se um usuario legado tiver senha em texto puro no banco, o sistema migra para hash no primeiro login valido.
- Todas as rotas de administracao exigem papel `admin`.
