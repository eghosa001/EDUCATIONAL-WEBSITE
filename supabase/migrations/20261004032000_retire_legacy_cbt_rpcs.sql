revoke all on function public.cbt_get_exam_questions(uuid) from public, anon, authenticated;
revoke all on function public.cbt_get_questions(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.cbt_grade(jsonb) from public, anon, authenticated;

grant execute on function public.cbt_get_exam_questions(uuid) to service_role;
grant execute on function public.cbt_get_questions(uuid, uuid, integer) to service_role;
grant execute on function public.cbt_grade(jsonb) to service_role;