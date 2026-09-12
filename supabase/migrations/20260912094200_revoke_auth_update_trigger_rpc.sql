begin;

-- Trigger helpers should execute only through their database trigger. They are
-- not part of the public RPC surface.
revoke all on function public.handle_auth_user_update() from public, anon, authenticated;

commit;
