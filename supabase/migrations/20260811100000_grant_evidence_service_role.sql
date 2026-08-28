-- Evidence mutations are server-only. The API authenticates and authorizes the
-- caller with the user-scoped client, then uses service_role for the canonical
-- metadata and private Storage mutation. RLS remains the read boundary for users.
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.evidence_items to service_role;
grant select, insert, update, delete on table public.evidence_question_links to service_role;
