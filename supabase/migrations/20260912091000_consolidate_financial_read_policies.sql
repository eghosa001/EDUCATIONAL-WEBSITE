begin;

do $$
declare
  t text;
begin
  foreach t in array array['payments','subscriptions','wallets','wallet_transactions','invoices','payment_methods']
  loop
    execute format('drop policy if exists %I_admin_read on public.%I', t, t);
    execute format('drop policy if exists %I_select_own on public.%I', t, t);
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format(
      'create policy %I_read on public.%I for select to authenticated using (user_id = (select auth.uid()) or public.has_role(''super_admin''))',
      t, t
    );
  end loop;
end $$;

commit;
