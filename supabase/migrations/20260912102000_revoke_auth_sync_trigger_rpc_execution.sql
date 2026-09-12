-- Auth synchronization functions are trigger-only. Prevent direct RPC execution.
revoke execute on function public.handle_auth_user_update() from public, anon, authenticated;
grant execute on function public.handle_auth_user_update() to service_role;
