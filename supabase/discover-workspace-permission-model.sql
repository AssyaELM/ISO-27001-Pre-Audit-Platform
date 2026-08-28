-- Discovery-only script: execute in Supabase SQL Editor (read-only) when workspace model
-- is unknown. Do not use this to mutate data.

-- 1) Resolve workspace table details
select
  c.table_schema,
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = ''public''
  and c.table_name = ''workspaces''
order by c.ordinal_position;

-- 2) Find tables that likely link workspaces and users
select
  t.table_schema,
  t.table_name,
  string_agg(c.column_name, '', '' order by c.ordinal_position) as columns
from information_schema.tables t
join information_schema.columns c
  on c.table_schema = t.table_schema
 and c.table_name = t.table_name
where t.table_schema = ''public''
  and t.table_type = ''BASE TABLE''
  and (
    exists (select 1 from information_schema.columns x where x.table_schema = t.table_schema and x.table_name = t.table_name and lower(x.column_name) like ''%workspace%id%'')
    or exists (select 1 from information_schema.columns x where x.table_schema = t.table_schema and x.table_name = t.table_name and lower(x.column_name) in (''user_id'', ''member_id'') )
    or exists (select 1 from information_schema.columns x where x.table_schema = t.table_schema and x.table_name = t.table_name and lower(x.column_name) like ''%role%'')
  )
group by t.table_schema, t.table_name
order by t.table_name;

-- 3) Show auth tables and workspace-like linkage columns
select
  table_schema,
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = ''public''
  and (lower(column_name) = ''workspace_id'' or lower(column_name) = ''owner_id'' or lower(column_name) = ''user_id'' or lower(column_name) = ''created_by'' or lower(column_name) like ''%role%'' or lower(column_name) like ''%member%'')
order by table_name, ordinal_position;

-- 4) Confirm current authenticated user table in this DB
select table_schema, table_name
from information_schema.tables
where table_schema = ''auth''
  and table_name = ''users'';

-- 5) Foreign key references to auth.users from public schema
select
  tc.constraint_name,
  kcu.table_schema,
  kcu.table_name,
  kcu.column_name,
  ccu.table_schema as referenced_schema,
  ccu.table_name as referenced_table,
  ccu.column_name as referenced_column
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on kcu.constraint_name = tc.constraint_name
 and kcu.constraint_schema = tc.constraint_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.constraint_schema = tc.constraint_schema
where tc.constraint_type = ''FOREIGN KEY''
  and tc.table_schema = ''public''
  and ccu.table_schema = ''auth''
  and ccu.table_name = ''users''
  and (lower(kcu.column_name) in (''user_id'', ''owner_id'', ''created_by'')
       or lower(kcu.column_name) like ''%owner%''
       or lower(kcu.column_name) like ''%member%''
      );

-- 6) Workspaces FK to auth.users, if any
select
  tc.constraint_name,
  kcu.column_name as workspace_column,
  ccu.table_name as referenced_table,
  ccu.column_name as referenced_column
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on kcu.constraint_name = tc.constraint_name
 and kcu.constraint_schema = tc.constraint_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.constraint_schema = tc.constraint_schema
where tc.table_schema = ''public''
  and tc.table_name = ''workspaces''
  and tc.constraint_type = ''FOREIGN KEY''
  and ccu.table_schema = ''auth''
  and ccu.table_name = ''users''
order by tc.constraint_name;
