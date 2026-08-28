alter table public.access_requests drop constraint if exists access_requests_auth_user_id_key;

create table if not exists public.activation_setup_sessions (
  id uuid primary key default gen_random_uuid(),
  token_id uuid not null references public.activation_tokens(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  proof_hash text not null unique check (char_length(proof_hash) = 64),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists activation_setup_sessions_workspace_idx on public.activation_setup_sessions(workspace_id);
alter table public.activation_setup_sessions enable row level security;
revoke all on public.activation_setup_sessions from anon, authenticated;
grant select, insert, update, delete on public.activation_setup_sessions to service_role;
