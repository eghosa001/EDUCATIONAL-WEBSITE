-- Worker queue/control tables are backend-only. PostgREST roles must not read or mutate them.
ALTER TABLE public.lesson_upgrade_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_worker_control ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.lesson_upgrade_queue FROM anon, authenticated;
REVOKE ALL ON TABLE public.lesson_worker_control FROM anon, authenticated;

-- These operations are performed by SECURITY DEFINER/service-role worker functions.
REVOKE ALL ON TABLE public.lesson_upgrade_queue FROM PUBLIC;
REVOKE ALL ON TABLE public.lesson_worker_control FROM PUBLIC;

-- Remove client execution of internal worker routines; service_role retains access.
REVOKE ALL ON FUNCTION public.claim_lesson_upgrade_batch(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_lesson_upgrade(uuid, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_lesson_upgrade_batch(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_lesson_upgrade(uuid, boolean, text) TO service_role;

ALTER FUNCTION public.claim_lesson_upgrade_batch(integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.complete_lesson_upgrade(uuid, boolean, text) SET search_path = public, pg_temp;
