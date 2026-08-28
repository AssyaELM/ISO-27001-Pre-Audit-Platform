create table if not exists public.ai_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  document_type text not null,
  status text not null default 'draft',
  version text not null,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finalized_at timestamptz,
  constraint ai_documents_type_check check (document_type in (
    'information_security_policy',
    'access_control_policy',
    'incident_management_procedure',
    'backup_restore_procedure',
    'asset_management_policy'
  )),
  constraint ai_documents_status_check check (status in ('draft', 'finalized')),
  constraint ai_documents_version_check check (btrim(version) <> '' and char_length(version) <= 100),
  constraint ai_documents_finalized_at_check check (
    (status = 'draft' and finalized_at is null)
    or (status = 'finalized' and finalized_at is not null)
  ),
  constraint ai_documents_workspace_type_version_unique unique (workspace_id, document_type, version)
);

create index if not exists ai_documents_workspace_type_status_idx
  on public.ai_documents (workspace_id, document_type, status, updated_at desc);

create or replace function public.validate_ai_document_registry_row()
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
  if not public.evidence_document_owner_in_workspace(new.workspace_id, new.created_by) then
    raise exception 'document creator is not a member of workspace';
  end if;
  if tg_op = 'INSERT' and coalesce(auth.role(), '') <> 'service_role' then
    new.created_by := auth.uid();
  end if;
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
      or new.workspace_id is distinct from old.workspace_id
      or new.document_type is distinct from old.document_type
      or new.version is distinct from old.version
      or new.created_by is distinct from old.created_by
      or new.created_at is distinct from old.created_at then
      raise exception 'AI document version identity is immutable';
    end if;
    if old.status = 'finalized' and new.status is distinct from old.status then
      raise exception 'a finalized AI document version cannot return to draft';
    end if;
  end if;
  if new.status = 'finalized' and new.finalized_at is null then
    new.finalized_at := now();
  elsif new.status = 'draft' then
    new.finalized_at := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_validate_ai_document_registry_row on public.ai_documents;
create trigger trg_validate_ai_document_registry_row
  before insert or update on public.ai_documents
  for each row execute function public.validate_ai_document_registry_row();

alter table public.ai_documents enable row level security;

create policy ai_documents_select on public.ai_documents
  for select to authenticated
  using (public.current_user_can_access_workspace(workspace_id));

grant select on table public.ai_documents to authenticated;
grant select, insert, update, delete on table public.ai_documents to service_role;

comment on table public.ai_documents is
  'Version registry for future user-triggered AI Documents drafts and finalized versions. No generated content or derived registry status is stored here.';
comment on column public.ai_documents.status is
  'draft or finalized only. Finalized means explicitly finalized by a user in NormCore, not certified or compliant.';
