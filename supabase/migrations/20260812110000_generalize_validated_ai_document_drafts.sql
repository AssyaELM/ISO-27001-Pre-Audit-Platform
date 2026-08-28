alter table public.ai_documents drop constraint if exists ai_documents_type_check;
alter table public.ai_documents add constraint ai_documents_type_check check (document_type in (
  'information_security_policy','access_control_policy','incident_management_procedure','backup_and_recovery_policy','information_asset_management_policy','backup_restore_procedure','asset_management_policy'
));

create or replace function public.create_validated_ai_document_draft(
  p_workspace_id uuid, p_document_type text, p_language text, p_title text, p_document_content jsonb,
  p_template_version text, p_mapping_version text, p_generation_contract_version text,
  p_provider text, p_provider_model text, p_provider_request_id text, p_provider_usage jsonb, p_idempotency_key text
) returns public.ai_documents language plpgsql security definer set search_path = '' as $$
declare existing public.ai_documents; next_version bigint; created public.ai_documents;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not public.current_user_can_access_workspace(p_workspace_id) then raise exception 'user is not member of workspace'; end if;
  if p_document_type not in ('information_security_policy','access_control_policy','incident_management_procedure','backup_and_recovery_policy','information_asset_management_policy')
    or p_language not in ('en','fr') or btrim(p_title)='' or jsonb_typeof(p_document_content)<>'object'
    or btrim(p_template_version)='' or btrim(p_mapping_version)='' or btrim(p_generation_contract_version)=''
    or btrim(p_provider)='' or btrim(p_provider_model)='' or btrim(p_idempotency_key)='' then raise exception 'invalid validated draft payload'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_workspace_id::text || ':' || p_document_type, 0));
  select * into existing from public.ai_documents where workspace_id=p_workspace_id and document_type=p_document_type and idempotency_key=p_idempotency_key;
  if found then if existing.document_content is distinct from p_document_content then raise exception 'idempotency key reused with different draft content'; end if; return existing; end if;
  select coalesce(max((substring(version from '^v([0-9]+)$'))::bigint),0)+1 into next_version from public.ai_documents where workspace_id=p_workspace_id and document_type=p_document_type and version ~ '^v[0-9]+$';
  insert into public.ai_documents(workspace_id,document_type,status,version,created_by,language,title,document_content,template_version,mapping_version,generation_contract_version,provider,provider_model,provider_request_id,provider_usage,idempotency_key)
  values(p_workspace_id,p_document_type,'draft','v'||next_version,auth.uid(),p_language,p_title,p_document_content,p_template_version,p_mapping_version,p_generation_contract_version,p_provider,p_provider_model,nullif(btrim(p_provider_request_id),''),p_provider_usage,p_idempotency_key) returning * into created;
  return created;
end; $$;
revoke all on function public.create_validated_ai_document_draft(uuid,text,text,text,jsonb,text,text,text,text,text,text,jsonb,text) from public;
grant execute on function public.create_validated_ai_document_draft(uuid,text,text,text,jsonb,text,text,text,text,text,text,jsonb,text) to authenticated;
