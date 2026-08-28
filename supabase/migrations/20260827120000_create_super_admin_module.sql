create extension if not exists citext;
create extension if not exists pgcrypto;

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'super_admin' check (role = 'super_admin'),
  active boolean not null default true,
  preferences jsonb not null default '{"activation_alerts":true,"weekly_portfolio_summary":true,"audit_export_reminders":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_admin_profiles (
  workspace_id uuid primary key references public.workspaces(id) on delete restrict,
  primary_email citext not null,
  status text not null default 'pending_activation' check (status in ('pending_activation','active','suspended','archived','deleted')),
  activation_status text not null default 'pending' check (activation_status in ('pending','invitation_sent','activated','expired','revoked')),
  onboarding_status text not null default 'not_started' check (onboarding_status in ('not_started','in_progress','completed')),
  onboarding_progress smallint not null default 0 check (onboarding_progress between 0 and 100),
  invitation_status text not null default 'pending' check (invitation_status in ('pending','sent','used','expired','revoked','failed')),
  last_activity_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_by uuid references public.platform_admins(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists organization_admin_profiles_provisioned_email_unique
  on public.organization_admin_profiles(primary_email)
  where created_by is not null and status <> 'deleted';

create table if not exists public.activation_tokens (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete restrict,
  token_hash text not null unique check (char_length(token_hash) = 64),
  token_preview text not null check (char_length(token_preview) between 4 and 8),
  status text not null default 'pending' check (status in ('pending','used','expired','revoked')),
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references public.platform_admins(user_id) on delete restrict,
  created_at timestamptz not null default now()
);

create unique index if not exists activation_tokens_one_pending_per_workspace
  on public.activation_tokens(workspace_id)
  where status = 'pending';
create index if not exists activation_tokens_workspace_created_idx
  on public.activation_tokens(workspace_id, created_at desc);

create table if not exists public.admin_activity_log (
  id bigint generated always as identity primary key,
  admin_user_id uuid references public.platform_admins(user_id) on delete set null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  action text not null check (action in (
    'organization_created','activation_token_generated','invitation_sent','invitation_resent',
    'token_regenerated','token_revoked','organization_suspended','organization_reactivated',
    'organization_archived','organization_deleted','settings_updated'
  )),
  result text not null default 'success' check (result in ('success','failed')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_log_created_idx on public.admin_activity_log(created_at desc);
create index if not exists admin_activity_log_workspace_idx on public.admin_activity_log(workspace_id, created_at desc);

create or replace function public.touch_super_admin_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists platform_admins_touch_updated_at on public.platform_admins;
create trigger platform_admins_touch_updated_at before update on public.platform_admins
for each row execute function public.touch_super_admin_updated_at();
drop trigger if exists organization_admin_profiles_touch_updated_at on public.organization_admin_profiles;
create trigger organization_admin_profiles_touch_updated_at before update on public.organization_admin_profiles
for each row execute function public.touch_super_admin_updated_at();

create or replace function public.current_user_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins
    where user_id = auth.uid() and role = 'super_admin' and active = true
  );
$$;

revoke all on function public.current_user_is_super_admin() from public;
grant execute on function public.current_user_is_super_admin() to authenticated;

alter table public.platform_admins enable row level security;
alter table public.organization_admin_profiles enable row level security;
alter table public.activation_tokens enable row level security;
alter table public.admin_activity_log enable row level security;

revoke all on public.platform_admins from anon, authenticated;
revoke all on public.organization_admin_profiles from anon, authenticated;
revoke all on public.activation_tokens from anon, authenticated;
revoke all on public.admin_activity_log from anon, authenticated;
grant select on public.platform_admins to authenticated;

drop policy if exists platform_admins_select_self on public.platform_admins;
create policy platform_admins_select_self on public.platform_admins
for select to authenticated
using (user_id = auth.uid() and active = true);

insert into public.organization_admin_profiles (
  workspace_id, primary_email, status, activation_status, onboarding_status,
  onboarding_progress, invitation_status, last_activity_at, created_at, updated_at
)
select
  w.id,
  lower(u.email)::citext,
  'active',
  'activated',
  case
    when coalesce((u.raw_user_meta_data #>> '{normcore_onboarding,completed}')::boolean, false) then 'completed'
    when coalesce((u.raw_user_meta_data #>> '{normcore_onboarding,current_screen}')::int, 0) > 0 then 'in_progress'
    else 'not_started'
  end,
  case
    when coalesce((u.raw_user_meta_data #>> '{normcore_onboarding,completed}')::boolean, false) then 100
    else least(99, round(coalesce((u.raw_user_meta_data #>> '{normcore_onboarding,current_screen}')::numeric, 0) * 100 / 9))::smallint
  end,
  'used',
  w.updated_at,
  w.created_at,
  w.updated_at
from public.workspaces w
join auth.users u on u.id = w.owner_id
where u.email is not null
on conflict (workspace_id) do nothing;

comment on table public.platform_admins is 'Platform roles, separate from organization membership.';
comment on table public.organization_admin_profiles is 'Non-confidential aggregate lifecycle metadata visible to platform administrators.';
comment on table public.activation_tokens is 'One-time activation tokens stored only as SHA-256 hashes; raw values are returned once.';
comment on table public.admin_activity_log is 'Immutable administrative audit events without client-confidential content.';
