alter function public.create_information_security_policy_draft(uuid, text, text, jsonb, text, text, text, text, text, text, jsonb, text) security definer;
alter function public.create_information_security_policy_draft(uuid, text, text, jsonb, text, text, text, text, text, text, jsonb, text) set search_path = '';
revoke all on function public.create_information_security_policy_draft(uuid, text, text, jsonb, text, text, text, text, text, text, jsonb, text) from public;
grant execute on function public.create_information_security_policy_draft(uuid, text, text, jsonb, text, text, text, text, text, text, jsonb, text) to authenticated;
