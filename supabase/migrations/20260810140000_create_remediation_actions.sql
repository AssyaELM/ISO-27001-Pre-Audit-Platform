create table if not exists public.remediation_actions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_key text not null,
  theme_id text not null,
  control_id text not null,
  question_id text not null,
  gap_code text not null,
  gap_level text not null check (gap_level in ('full_gap', 'partial_gap')),
  owner_user_id uuid references auth.users(id),
  due_date date,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'completed')),
  progress_note text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint remediation_actions_source_key_not_empty check (btrim(source_key) <> ''),
  constraint remediation_actions_theme_not_empty check (btrim(theme_id) <> ''),
  constraint remediation_actions_control_not_empty check (btrim(control_id) <> ''),
  constraint remediation_actions_question_not_empty check (btrim(question_id) <> ''),
  constraint remediation_actions_gap_code_not_empty check (btrim(gap_code) <> ''),
  constraint remediation_actions_workspace_source_unique unique (workspace_id, source_key)
);

create index if not exists remediation_actions_workspace_idx
  on public.remediation_actions (workspace_id);

create or replace function public.touch_remediation_action_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.validate_remediation_action()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not public.current_user_can_access_workspace(new.workspace_id) then
    raise exception 'user is not member of workspace';
  end if;
  if new.owner_user_id is not null and new.owner_user_id <> auth.uid() then
    raise exception 'owner must be an active workspace member';
  end if;
  if TG_OP = 'UPDATE' and (
    new.workspace_id is distinct from old.workspace_id
    or new.source_key is distinct from old.source_key
    or new.theme_id is distinct from old.theme_id
    or new.control_id is distinct from old.control_id
    or new.question_id is distinct from old.question_id
    or new.gap_code is distinct from old.gap_code
    or new.gap_level is distinct from old.gap_level
  ) then
    raise exception 'remediation source identity is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_remediation_action on public.remediation_actions;
create trigger trg_validate_remediation_action
before insert or update on public.remediation_actions
for each row execute function public.validate_remediation_action();

drop trigger if exists trg_touch_remediation_action_updated_at on public.remediation_actions;
create trigger trg_touch_remediation_action_updated_at
before update on public.remediation_actions
for each row execute function public.touch_remediation_action_updated_at();

alter table public.remediation_actions enable row level security;

drop policy if exists remediation_actions_select on public.remediation_actions;
create policy remediation_actions_select on public.remediation_actions
  for select to authenticated
  using (public.current_user_can_access_workspace(workspace_id));

drop policy if exists remediation_actions_insert on public.remediation_actions;
create policy remediation_actions_insert on public.remediation_actions
  for insert to authenticated
  with check (public.current_user_can_access_workspace(workspace_id));

drop policy if exists remediation_actions_update on public.remediation_actions;
create policy remediation_actions_update on public.remediation_actions
  for update to authenticated
  using (public.current_user_can_access_workspace(workspace_id))
  with check (public.current_user_can_access_workspace(workspace_id));

grant select, insert, update on table public.remediation_actions to authenticated;

comment on table public.remediation_actions is
  'Workflow state for active Assessment-derived remediation actions. Business wording remains in canonical assessment catalogs.';

