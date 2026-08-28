create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

DO $$ 
BEGIN
  CREATE TYPE public.assessment_answer AS ENUM (
    'implemented',
    'partially_implemented',
    'not_implemented',
    'not_sure',
    'not_applicable'
  );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.assessment_review_status AS ENUM (
    'draft',
    'submitted',
    'validated',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

create or replace function public.current_user_workspace_role(p_workspace_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = p_workspace_id
      and w.owner_id = auth.uid()
  );
$$;

create or replace function public.current_user_can_access_workspace(p_workspace_id uuid)
returns boolean
language sql
stable
as $$
  select public.current_user_workspace_role(p_workspace_id)
$$;

create or replace function public.current_user_can_validate_workspace(p_workspace_id uuid)
returns boolean
language sql
stable
as $$
  select public.current_user_workspace_role(p_workspace_id)
$$;

create or replace function public.validate_assessment_response()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if new.workspace_id is null then
    raise exception 'workspace_id is required';
  end if;

  if new.question_id is null or btrim(new.question_id) = '' then
    raise exception 'question_id is required';
  end if;

  if new.answer = 'not_applicable' and nullif(btrim(coalesce(new.justification, '')), '') is null then
    raise exception 'not_applicable responses require justification';
  end if;

  if not public.current_user_can_access_workspace(new.workspace_id) then
    raise exception 'user is not member of workspace';
  end if;

  if TG_OP = 'INSERT' then
    new.review_status := coalesce(new.review_status, 'draft');
    new.responded_by := auth.uid();
    new.responded_at := now();
  else
    if new.review_status in ('validated', 'rejected') then
      if not public.current_user_can_validate_workspace(new.workspace_id) then
        raise exception 'user cannot validate or reject responses';
      end if;
      new.validated_by := auth.uid();
      new.validated_at := now();
    else
      if old.review_status in ('validated', 'rejected') then
        new.validated_by := null;
        new.validated_at := null;
      end if;
    end if;

    if new.answer is distinct from old.answer then
      new.responded_by := auth.uid();
      new.responded_at := now();
    end if;
  end if;

  if new.review_status in ('validated', 'rejected') then
    if new.validated_by is null or new.validated_at is null then
      raise exception 'validation metadata is required for validated/rejected responses';
    end if;
  else
    new.validated_by := null;
    new.validated_at := null;
  end if;

  return new;
end;
$$;

create or replace function public.touch_assessment_response_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.immutable_response_workspace_question()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'UPDATE' and (new.workspace_id is distinct from old.workspace_id or new.question_id is distinct from old.question_id) then
    raise exception 'workspace_id and question_id are immutable';
  end if;
  return new;
end;
$$;

create table if not exists public.assessment_responses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  theme_id text not null,
  control_id text not null,
  question_id text not null,
  answer public.assessment_answer not null,
  justification text,
  comment text,
  evidence_reference text,
  review_status public.assessment_review_status not null default 'draft',
  responded_by uuid not null references auth.users(id),
  responded_at timestamptz not null default now(),
  validated_by uuid references auth.users(id),
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_responses_theme_id_not_empty check (btrim(theme_id) <> ''),
  constraint assessment_responses_control_id_not_empty check (btrim(control_id) <> ''),
  constraint assessment_responses_question_id_not_empty check (btrim(question_id) <> ''),
  constraint assessment_responses_justification_not_applicable
    check (answer <> 'not_applicable' or (justification is not null and btrim(justification) <> '')),
  constraint assessment_responses_review_status_validated_requires_reviewer
    check (
      (review_status in ('validated','rejected') and validated_by is not null and validated_at is not null)
      or (review_status not in ('validated','rejected') and validated_by is null and validated_at is null)
    ),
  constraint assessment_responses_question_uniqueness unique (workspace_id, question_id)
);

create index if not exists assessment_responses_workspace_idx on public.assessment_responses (workspace_id);
create index if not exists assessment_responses_question_idx on public.assessment_responses (question_id);

drop trigger if exists trg_validate_assessment_response on public.assessment_responses;
create trigger trg_validate_assessment_response
before insert or update on public.assessment_responses
for each row
execute function public.validate_assessment_response();

drop trigger if exists trg_touch_assessment_response_updated_at on public.assessment_responses;
create trigger trg_touch_assessment_response_updated_at
before update on public.assessment_responses
for each row
execute function public.touch_assessment_response_updated_at();

drop trigger if exists trg_immutable_assessment_response_keys on public.assessment_responses;
create trigger trg_immutable_assessment_response_keys
before update on public.assessment_responses
for each row
execute function public.immutable_response_workspace_question();

alter table public.assessment_responses enable row level security;

create policy assessment_responses_select
  on public.assessment_responses
  for select
  using (public.current_user_can_access_workspace(workspace_id));

create policy assessment_responses_insert
  on public.assessment_responses
  for insert
  with check (public.current_user_can_access_workspace(workspace_id));

create policy assessment_responses_update
  on public.assessment_responses
  for update
  using (public.current_user_can_access_workspace(workspace_id));

create policy assessment_responses_delete
  on public.assessment_responses
  for delete
  using (public.current_user_can_validate_workspace(workspace_id));

comment on table public.assessment_responses is 'Stores one assessment response per workspace/question with review workflow states.';
comment on column public.assessment_responses.answer is 'Allowed answers: implemented | partially_implemented | not_implemented | not_sure | not_applicable (not_applicable requires justification).';
comment on column public.assessment_responses.review_status is 'Allowed validation statuses: draft | submitted | validated | rejected.';
