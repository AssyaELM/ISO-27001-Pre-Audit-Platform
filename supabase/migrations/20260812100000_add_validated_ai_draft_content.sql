alter table public.ai_documents
  add column if not exists language text,
  add column if not exists title text,
  add column if not exists document_content jsonb,
  add column if not exists template_version text,
  add column if not exists mapping_version text,
  add column if not exists generation_contract_version text,
  add column if not exists generation_contract_version text,
  add column if not exists provider text,
  add column if not exists provider_model text,
  add column if not exists provider_request_id text,
  add column if not exists provider_usage jsonb,
  add column if not exists idempotency_key text;

alter table public.ai_documents
  drop constraint if exists ai_documents_language_check,
  add constraint ai_documents_language_check check (language is null or language in ('en', 'fr')),
  drop constraint if exists ai_documents_content_check,
  add constraint ai_documents_content_check check (document_content is null or jsonb_typeof(document_content) = 'object'),
  drop constraint if exists ai_documents_idempotency_key_check,
  add constraint ai_documents_idempotency_key_check check (idempotency_key is null or (btrim(idempotency_key) <> '' and char_length(idempotency_key) <= 200));

create unique index if not exists ai_documents_workspace_type_idempotency_unique
  on public.ai_documents (workspace_id, document_type, idempotency_key)
  where idempotency_key is not null;

create policy ai_documents_insert on public.ai_documents
  for insert to authenticated
  with check (
    public.current_user_can_access_workspace(workspace_id)
    and created_by = auth.uid()
  );

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
    if old.status = 'finalized' and (
      new.status is distinct from old.status
      or new.finalized_at is distinct from old.finalized_at
      or new.language is distinct from old.language
      or new.title is distinct from old.title
      or new.document_content is distinct from old.document_content
      or new.template_version is distinct from old.template_version
      or new.mapping_version is distinct from old.mapping_version
      or new.generation_contract_version is distinct from old.generation_contract_version
      or new.generation_contract_version is distinct from old.generation_contract_version
      or new.provider is distinct from old.provider
      or new.provider_model is distinct from old.provider_model
      or new.provider_request_id is distinct from old.provider_request_id
      or new.provider_usage is distinct from old.provider_usage
      or new.idempotency_key is distinct from old.idempotency_key
    ) then
      raise exception 'a finalized AI document version is immutable';
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

create or replace function public.create_information_security_policy_draft(
  p_workspace_id uuid,
  p_language text,
  p_title text,
  p_document_content jsonb,
  p_template_version text,
  p_mapping_version text,
  p_generation_contract_version text,
  p_provider text,
  p_provider_model text,
  p_provider_request_id text,
  p_provider_usage jsonb,
  p_idempotency_key text
)
returns public.ai_documents
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing public.ai_documents;
  next_version bigint;
  created public.ai_documents;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not public.current_user_can_access_workspace(p_workspace_id) then raise exception 'user is not member of workspace'; end if;
  if p_language not in ('en', 'fr') or btrim(p_title) = '' or jsonb_typeof(p_document_content) <> 'object'
    or btrim(p_template_version) = '' or btrim(p_mapping_version) = '' or btrim(p_generation_contract_version) = ''
    or btrim(p_provider) = '' or btrim(p_provider_model) = '' or btrim(p_idempotency_key) = '' then
    raise exception 'invalid validated draft payload';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_workspace_id::text || ':information_security_policy', 0));
  select * into existing from public.ai_documents
    where workspace_id = p_workspace_id and document_type = 'information_security_policy' and idempotency_key = p_idempotency_key;
  if found then
    if existing.document_content is distinct from p_document_content then raise exception 'idempotency key reused with different draft content'; end if;
    return existing;
  end if;

  select coalesce(max((substring(version from '^v([0-9]+)$'))::bigint), 0) + 1
    into next_version
    from public.ai_documents
    where workspace_id = p_workspace_id and document_type = 'information_security_policy' and version ~ '^v[0-9]+$';

  insert into public.ai_documents (
    workspace_id, document_type, status, version, created_by, language, title, document_content,
    template_version, mapping_version, generation_contract_version, provider, provider_model,
    provider_request_id, provider_usage, idempotency_key
  ) values (
    p_workspace_id, 'information_security_policy', 'draft', 'v' || next_version, auth.uid(), p_language, p_title, p_document_content,
    p_template_version, p_mapping_version, p_generation_contract_version, p_provider, p_provider_model,
    nullif(btrim(p_provider_request_id), ''), p_provider_usage, p_idempotency_key
  ) returning * into created;
  return created;
end;
$$;

revoke all on function public.create_information_security_policy_draft(uuid, text, text, jsonb, text, text, text, text, text, text, jsonb, text) from public;
grant execute on function public.create_information_security_policy_draft(uuid, text, text, jsonb, text, text, text, text, text, text, jsonb, text) to authenticated;

comment on function public.create_information_security_policy_draft(uuid, text, text, jsonb, text, text, text, text, text, text, jsonb, text) is
  'Creates only a fully validated Information Security Policy draft. The function is atomic, workspace-scoped, versioned and idempotent.';
