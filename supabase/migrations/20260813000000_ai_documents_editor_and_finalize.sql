create or replace function public.update_ai_document_draft_content(
  p_workspace_id uuid, p_document_type text, p_version text, p_document_content jsonb
) returns void language plpgsql security definer set search_path = '' as $$
declare
  existing public.ai_documents;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not public.current_user_can_access_workspace(p_workspace_id) then raise exception 'user is not member of workspace'; end if;
  
  select * into existing from public.ai_documents 
  where workspace_id=p_workspace_id and document_type=p_document_type and version=p_version;
  
  if not found then raise exception 'document draft not found'; end if;
  if existing.status <> 'draft' then raise exception 'cannot update a finalized document'; end if;

  update public.ai_documents
  set document_content = p_document_content
  where id = existing.id;
end; $$;
revoke all on function public.update_ai_document_draft_content(uuid,text,text,jsonb) from public;
grant execute on function public.update_ai_document_draft_content(uuid,text,text,jsonb) to authenticated;


create or replace function public.finalize_ai_document_draft(
  p_workspace_id uuid, p_document_type text, p_version text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  existing public.ai_documents;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if not public.current_user_can_access_workspace(p_workspace_id) then raise exception 'user is not member of workspace'; end if;
  
  select * into existing from public.ai_documents 
  where workspace_id=p_workspace_id and document_type=p_document_type and version=p_version;
  
  if not found then raise exception 'document draft not found'; end if;
  if existing.status <> 'draft' then raise exception 'document is already finalized'; end if;

  update public.ai_documents
  set status = 'finalized'
  where id = existing.id;
end; $$;
revoke all on function public.finalize_ai_document_draft(uuid,text,text) from public;
grant execute on function public.finalize_ai_document_draft(uuid,text,text) to authenticated;
