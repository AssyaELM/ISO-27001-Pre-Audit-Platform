create table if not exists public.evidence_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  storage_bucket text not null default 'evidence',
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  uploaded_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evidence_items_identity_workspace_unique unique (id, workspace_id),
  constraint evidence_items_storage_object_unique unique (storage_bucket, storage_path),
  constraint evidence_items_bucket_check check (storage_bucket = 'evidence'),
  constraint evidence_items_path_not_empty check (btrim(storage_path) <> ''),
  constraint evidence_items_filename_not_empty check (btrim(original_filename) <> ''),
  constraint evidence_items_filename_length check (char_length(original_filename) <= 255),
  constraint evidence_items_mime_type_check check (
    mime_type in ('application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'text/csv')
  ),
  constraint evidence_items_size_check check (size_bytes > 0 and size_bytes <= 10485760)
);

create index if not exists evidence_items_workspace_idx
  on public.evidence_items (workspace_id, created_at desc);

create table if not exists public.evidence_question_links (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  theme_id text not null,
  control_id text not null,
  question_id text not null,
  linked_by uuid not null default auth.uid() references auth.users(id),
  linked_at timestamptz not null default now(),
  constraint evidence_question_links_item_workspace_fk
    foreign key (evidence_id, workspace_id)
    references public.evidence_items(id, workspace_id)
    on delete cascade,
  constraint evidence_question_links_identity_unique
    unique (evidence_id, workspace_id, theme_id, control_id, question_id),
  constraint evidence_question_links_theme_check
    check (theme_id in ('organizational', 'people', 'physical', 'technological')),
  constraint evidence_question_links_control_not_empty check (btrim(control_id) <> ''),
  constraint evidence_question_links_question_not_empty check (btrim(question_id) <> '')
);

create index if not exists evidence_question_links_workspace_question_idx
  on public.evidence_question_links (workspace_id, theme_id, control_id, question_id);
create index if not exists evidence_question_links_evidence_idx
  on public.evidence_question_links (evidence_id);

create or replace function public.validate_evidence_item()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'not authenticated';
  end if;
  if coalesce(auth.role(), '') <> 'service_role'
    and not public.current_user_can_access_workspace(new.workspace_id) then
    raise exception 'user is not member of workspace';
  end if;
  if new.storage_bucket <> 'evidence' then
    raise exception 'invalid evidence storage bucket';
  end if;
  if new.storage_path not like new.workspace_id::text || '/' || new.id::text || '/%' then
    raise exception 'invalid evidence storage path';
  end if;
  if tg_op = 'INSERT' then
    if coalesce(auth.role(), '') <> 'service_role' then
      new.uploaded_by := auth.uid();
    end if;
  elsif new.id is distinct from old.id
    or new.workspace_id is distinct from old.workspace_id
    or new.uploaded_by is distinct from old.uploaded_by
    or new.created_at is distinct from old.created_at then
    raise exception 'evidence identity metadata is immutable';
  end if;
  return new;
end;
$$;

create or replace function public.validate_evidence_question_link()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'not authenticated';
  end if;
  if coalesce(auth.role(), '') <> 'service_role'
    and not public.current_user_can_access_workspace(new.workspace_id) then
    raise exception 'user is not member of workspace';
  end if;
  if tg_op = 'INSERT' then
    if coalesce(auth.role(), '') <> 'service_role' then
      new.linked_by := auth.uid();
    end if;
  elsif new.evidence_id is distinct from old.evidence_id
    or new.workspace_id is distinct from old.workspace_id
    or new.theme_id is distinct from old.theme_id
    or new.control_id is distinct from old.control_id
    or new.question_id is distinct from old.question_id
    or new.linked_by is distinct from old.linked_by
    or new.linked_at is distinct from old.linked_at then
    raise exception 'evidence link identity is immutable';
  end if;
  return new;
end;
$$;

create or replace function public.touch_evidence_item_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_validate_evidence_item on public.evidence_items;
create trigger trg_validate_evidence_item
  before insert or update on public.evidence_items
  for each row execute function public.validate_evidence_item();

drop trigger if exists trg_touch_evidence_item_updated_at on public.evidence_items;
create trigger trg_touch_evidence_item_updated_at
  before update on public.evidence_items
  for each row execute function public.touch_evidence_item_updated_at();

drop trigger if exists trg_validate_evidence_question_link on public.evidence_question_links;
create trigger trg_validate_evidence_question_link
  before insert or update on public.evidence_question_links
  for each row execute function public.validate_evidence_question_link();

alter table public.evidence_items enable row level security;
alter table public.evidence_question_links enable row level security;

create policy evidence_items_select on public.evidence_items
  for select to authenticated
  using (public.current_user_can_access_workspace(workspace_id));
create policy evidence_question_links_select on public.evidence_question_links
  for select to authenticated
  using (public.current_user_can_access_workspace(workspace_id));
grant select on table public.evidence_items to authenticated;
grant select on table public.evidence_question_links to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence',
  'evidence',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'text/csv']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.evidence_storage_workspace_id(object_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return split_part(object_name, '/', 1)::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

create policy evidence_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'evidence'
    and public.current_user_can_access_workspace(public.evidence_storage_workspace_id(name))
  );
comment on table public.evidence_items is
  'Canonical metadata for private Evidence Room V1 files. Evidence review states are intentionally out of scope.';
comment on table public.evidence_question_links is
  'Canonical many-to-many links between Evidence Room files and Assessment catalog questions.';
comment on column public.assessment_responses.evidence_reference is
  'Legacy opaque reference. It is not a canonical Evidence Room file and must not drive Evidence status.';
