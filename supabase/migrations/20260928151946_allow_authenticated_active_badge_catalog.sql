-- Students need to see active achievement definitions while private
-- progress and earned-achievement rows remain protected by their own RLS.
drop policy if exists badges_admin_read on public.badges;
drop policy if exists badges_read on public.badges;

create policy badges_read
on public.badges
for select
to authenticated
using (
  is_active = true
  or has_role('admin'::text)
  or has_role('super_admin'::text)
);
