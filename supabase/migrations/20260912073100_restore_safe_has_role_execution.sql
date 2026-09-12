-- RLS policies call has_role(text) for row-level authorization. The helper is
-- SECURITY DEFINER, uses auth.uid(), has a fixed search_path, and callers cannot
-- create objects in public; granting EXECUTE lets the policies evaluate rather
-- than fail with permission denied. Anonymous callers safely receive false.
grant execute on function public.has_role(text) to authenticated, anon;
