-- Application users need explicit PostgREST privileges in addition to RLS policies.
grant select, insert, update on table public.workspaces to authenticated;
grant select, insert, update on table public.assessment_responses to authenticated;
grant execute on function public.current_user_workspace_role(uuid) to authenticated;
grant execute on function public.current_user_can_access_workspace(uuid) to authenticated;
grant execute on function public.current_user_can_validate_workspace(uuid) to authenticated;

alter table public.workspaces enable row level security;

drop policy if exists workspaces_select_own on public.workspaces;
create policy workspaces_select_own
  on public.workspaces
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists workspaces_insert_own on public.workspaces;
create policy workspaces_insert_own
  on public.workspaces
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists workspaces_update_own on public.workspaces;
create policy workspaces_update_own
  on public.workspaces
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
