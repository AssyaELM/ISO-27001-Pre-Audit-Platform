alter table public.access_requests drop constraint if exists access_requests_email_key;
create unique index if not exists access_requests_one_pending_email_idx
  on public.access_requests(email) where status = 'pending';

alter table public.admin_activity_log
  drop constraint if exists admin_activity_log_action_check;
alter table public.admin_activity_log
  add constraint admin_activity_log_action_check check (action in (
    'organization_created','activation_token_generated','activation_token_regenerated','invitation_sent','invitation_resent',
    'token_regenerated','token_revoked','organization_suspended','organization_reactivated','organization_archived',
    'organization_deleted','settings_updated','access_request_created','access_request_approved','access_request_rejected',
    'access_request_deleted','approval_email_sent','approval_email_failed','invitation_email_sent','invitation_email_failed'
  ));
