-- Supabase post-migration validation (read-only checks)

-- 1) enums
select
  typname as enum_name,
  oid::regtype::text as enum_type
from pg_type
where typname in ('assessment_answer', 'assessment_review_status');

-- 2) table exists
select
  t.table_schema,
  t.table_name
from information_schema.tables t
where t.table_schema = 'public'
  and t.table_name = 'assessment_responses';

-- 3) workspace_id type and FK target
select
  a.attname as column_name,
  a.atttypid::regtype::text as column_type,
  ccu.table_schema as referenced_schema,
  ccu.table_name as referenced_table,
  ccu.column_name as referenced_column
from pg_attribute a
join pg_constraint co
  on co.conrelid = 'public.assessment_responses'::regclass
 and co.contype = 'f'
left join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = co.conname
 and ccu.constraint_schema = 'public'
where a.attrelid = 'public.assessment_responses'::regclass
  and a.attname = 'workspace_id';

-- 3b) workspace model used for permissions
select
  n.nspname as table_schema,
  c.relname as table_name,
  a.attname as column_name,
  a.atttypid::regtype::text as data_type
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_attribute a on a.attrelid = c.oid
where n.nspname = 'public'
  and c.relname = 'workspaces'
  and a.attname in ('id', 'owner_id')
  and a.attnum > 0
order by a.attnum;

-- 4) uniqueness + required constraints
select
  con.conname as constraint_name,
  con.contype as constraint_type,
  con.conkey
from pg_constraint con
where con.conrelid = 'public.assessment_responses'::regclass
  and con.conname in ('assessment_responses_question_uniqueness',
                      'assessment_responses_justification_not_applicable',
                      'assessment_responses_review_status_validated_requires_reviewer',
                      'assessment_responses_theme_id_not_empty',
                      'assessment_responses_control_id_not_empty',
                      'assessment_responses_question_id_not_empty');

-- 5) triggers
select
  t.tgname as trigger_name,
  t.tgtype,
  t.tgenabled
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'assessment_responses'
  and t.tgisinternal = false
  and t.tgname like 'trg_%assessment_response%'
order by t.tgname;

-- 6) RLS enabled
select relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'assessment_responses';

-- 7) RLS policies
select
  policyname,
  cmd,
  permissive
from pg_policies
where schemaname = 'public'
  and tablename = 'assessment_responses'
order by policyname;

-- 8) validation helper functions exist
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('current_user_can_access_workspace', 'current_user_can_validate_workspace',
                    'current_user_workspace_role', 'validate_assessment_response',
                    'touch_assessment_response_updated_at', 'immutable_response_workspace_question');
