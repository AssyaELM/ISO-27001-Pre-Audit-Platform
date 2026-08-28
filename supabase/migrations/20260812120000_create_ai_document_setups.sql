create table if not exists public.ai_document_setups (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  document_type text not null,
  setup_values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, document_type),
  constraint ai_document_setups_type_check check (document_type in (
    'information_security_policy',
    'access_control_policy',
    'incident_management_procedure',
    'backup_restore_procedure',
    'asset_management_policy',
    'backup_and_recovery_policy',
    'information_asset_management_policy'
  )),
  constraint ai_document_setups_values_check check (jsonb_typeof(setup_values) = 'object')
);

create index if not exists ai_document_setups_workspace_type_idx
  on public.ai_document_setups (workspace_id, document_type);

create or replace function public.validate_ai_document_setups_row()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'not authenticated';
  end if;
  if coalesce(auth.role(), '') <> 'service_role'
    and not public.current_user_can_access_workspace(new.workspace_id) then
    raise exception 'user is not member of workspace';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_validate_ai_document_setups_row on public.ai_document_setups;
create trigger trg_validate_ai_document_setups_row
  before insert or update on public.ai_document_setups
  for each row execute function public.validate_ai_document_setups_row();

alter table public.ai_document_setups enable row level security;

create policy ai_document_setups_select on public.ai_document_setups
  for select to authenticated
  using (public.current_user_can_access_workspace(workspace_id));

create policy ai_document_setups_insert on public.ai_document_setups
  for insert to authenticated
  with check (public.current_user_can_access_workspace(workspace_id));

create policy ai_document_setups_update on public.ai_document_setups
  for update to authenticated
  using (public.current_user_can_access_workspace(workspace_id));

grant select, insert, update on table public.ai_document_setups to authenticated;
grant select, insert, update, delete on table public.ai_document_setups to service_role;

comment on table public.ai_document_setups is
  'Stores pre-generation manual input setups for AI documents. Separated from registry to preserve V1/draft isolation.';
