grant select, insert, update, delete on table public.platform_admins to service_role;
grant select, insert, update, delete on table public.organization_admin_profiles to service_role;
grant select, insert, update, delete on table public.activation_tokens to service_role;
grant select, insert, update, delete on table public.admin_activity_log to service_role;
grant usage, select on sequence public.admin_activity_log_id_seq to service_role;
