-- Browser clients use web-api for this metadata; keep the SECURITY DEFINER
-- aggregate callable only by the service role.
revoke execute on function public.get_past_question_availability() from anon, authenticated;
grant execute on function public.get_past_question_availability() to service_role;
