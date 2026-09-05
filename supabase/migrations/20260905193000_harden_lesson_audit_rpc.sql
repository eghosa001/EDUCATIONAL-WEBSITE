-- Harden lesson quality queue RPCs: they are internal worker functions, not client APIs.
-- Keep SECURITY DEFINER behavior for the service-role worker while preventing public execution.
REVOKE EXECUTE ON FUNCTION public.claim_lesson_quality_audits(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_lesson_quality_audits(integer, boolean) FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.claim_lesson_quality_audits(integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.claim_lesson_quality_audits(integer, boolean) SET search_path = public, pg_temp;
ALTER FUNCTION public.set_lesson_quality_audit_updated_at() SET search_path = public, pg_temp;
