alter table public.evidence_items
  add column if not exists document_type text,
  add column if not exists document_version text,
  add column if not exists effective_date date,
  add column if not exists review_date date,
  add column if not exists document_owner_id uuid references auth.users(id) on delete set null;

alter table public.evidence_items
  drop constraint if exists evidence_items_document_type_check,
  add constraint evidence_items_document_type_check check (
    document_type is null or document_type in (
      'information_security_policy',
      'access_control_policy',
      'incident_management_procedure',
      'backup_restore_procedure',
      'asset_management_policy',
      'other'
    )
  ),
  drop constraint if exists evidence_items_document_version_check,
  add constraint evidence_items_document_version_check check (
    document_version is null or (btrim(document_version) <> '' and char_length(document_version) <= 100)
  ),
  drop constraint if exists evidence_items_document_dates_check,
  add constraint evidence_items_document_dates_check check (
    effective_date is null or review_date is null or review_date >= effective_date
  );

create or replace function public.evidence_document_owner_in_workspace(
  p_workspace_id uuid,
  p_owner_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = p_workspace_id
      and w.owner_id = p_owner_id
  );
$$;

revoke all on function public.evidence_document_owner_in_workspace(uuid, uuid) from public;
grant execute on function public.evidence_document_owner_in_workspace(uuid, uuid) to authenticated, service_role;

create or replace function public.validate_evidence_document_metadata()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.document_owner_id is not null
    and not public.evidence_document_owner_in_workspace(new.workspace_id, new.document_owner_id) then
    raise exception 'document owner is not a member of workspace';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_evidence_document_metadata on public.evidence_items;
create trigger trg_validate_evidence_document_metadata
  before insert or update of workspace_id, document_owner_id on public.evidence_items
  for each row execute function public.validate_evidence_document_metadata();

comment on column public.evidence_items.document_type is 'Optional user-selected canonical document classification.';
comment on column public.evidence_items.document_version is 'Optional user-provided document version, maximum 100 characters.';
comment on column public.evidence_items.effective_date is 'Optional document effective date.';
comment on column public.evidence_items.review_date is 'Optional next review date used for deterministic review state.';
comment on column public.evidence_items.document_owner_id is 'Optional workspace member responsible for the document.';
