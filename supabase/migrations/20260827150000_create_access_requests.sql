create extension if not exists citext;
create extension if not exists pgcrypto;

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  email citext not null unique,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.platform_admins(user_id) on delete set null,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint access_requests_review_state check (
    (status = 'pending' and reviewed_at is null and reviewed_by is null)
    or (status in ('approved','rejected') and reviewed_at is not null and reviewed_by is not null)
  )
);

create index if not exists access_requests_status_requested_idx
  on public.access_requests(status, requested_at desc);

drop trigger if exists access_requests_touch_updated_at on public.access_requests;
create trigger access_requests_touch_updated_at before update on public.access_requests
for each row execute function public.touch_super_admin_updated_at();

alter table public.access_requests enable row level security;
revoke all on public.access_requests from anon, authenticated;
grant select, insert, update, delete on public.access_requests to service_role;

create or replace function public.current_user_access_request_status()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select ar.status from public.access_requests ar where ar.auth_user_id = auth.uid()),
    'legacy'
  );
$$;

revoke all on function public.current_user_access_request_status() from public;
grant execute on function public.current_user_access_request_status() to authenticated;

alter table public.admin_activity_log
  drop constraint if exists admin_activity_log_action_check;
alter table public.admin_activity_log
  add constraint admin_activity_log_action_check check (action in (
    'organization_created','activation_token_generated','invitation_sent','invitation_resent',
    'token_regenerated','token_revoked','organization_suspended','organization_reactivated',
    'organization_archived','organization_deleted','settings_updated',
    'access_request_created','access_request_approved','access_request_rejected','access_request_deleted',
    'approval_email_sent','approval_email_failed','invitation_email_sent','invitation_email_failed'
  ));

comment on table public.access_requests is 'Public NormCore access requests. Pending and rejected users are authenticated but not product-authorized.';
comment on function public.current_user_access_request_status() is 'Returns pending/approved/rejected for request-access users and legacy for pre-existing organization accounts.';
