-- Performance and integrity indexes for admin monitoring and auth paths.
create index if not exists idx_activity_logs_created_at_desc
  on public.activity_logs (created_at desc);

create index if not exists idx_activity_logs_username_created_at_desc
  on public.activity_logs (username, created_at desc);

create index if not exists idx_activity_logs_action_created_at_desc
  on public.activity_logs (action, created_at desc);

create unique index if not exists idx_users_username_unique
  on public.users (username);

create index if not exists idx_users_ativo_created_at_desc
  on public.users (ativo, created_at desc);
