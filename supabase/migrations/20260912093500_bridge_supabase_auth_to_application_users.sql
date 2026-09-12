begin;

-- Supabase Auth owns passwords for these identities; local hashes are optional.
alter table public.users alter column password_hash drop not null;

create temporary table _identity_pairs (
  legacy_id uuid primary key,
  auth_id uuid not null unique,
  email text not null
) on commit drop;

insert into _identity_pairs (legacy_id, auth_id, email) values
  ('ad2305bf-4be3-45f7-873e-c57be5a8f479','7423925e-c269-47a0-a35f-17a00405b3cc','admin@learnforge.ng'),
  ('7eb491ff-7e0e-49d6-9b67-bafbd2bfb78e','4dafca93-0d65-44f3-aa12-24867687d3b7','newuser@test.com'),
  ('20e1c9bd-c51c-40fb-8854-ada3f6bd086e','579407be-b445-42ba-849f-6a9345c5ed11','student@learnforge.ng'),
  ('00591e2d-54a9-40d1-94cb-b1188b1407cd','7a3394ee-f5e8-4e0d-b7a4-10a6746fd5eb','teacher@learnforge.ng');

-- This historical reconciliation is guarded so fresh databases without these
-- legacy rows simply skip the pair-specific merge and continue with auth sync.
delete from _identity_pairs p
where not exists (select 1 from public.users u where u.id = p.legacy_id)
   or not exists (select 1 from auth.users au where au.id = p.auth_id);

update public.users u
set email = '__legacy__' || u.id::text || '@invalid.local'
from _identity_pairs p
where u.id = p.legacy_id;

insert into public.users (
  id, email, phone, password_hash, first_name, last_name, middle_name,
  date_of_birth, gender, avatar_url, is_verified, is_active, last_login_at,
  email_verified_at, phone_verified_at, created_at, updated_at
)
select
  p.auth_id, p.email, u.phone, null, u.first_name, u.last_name, u.middle_name,
  u.date_of_birth, u.gender, u.avatar_url,
  coalesce(u.is_verified, au.email_confirmed_at is not null),
  coalesce(u.is_active, true), u.last_login_at,
  coalesce(u.email_verified_at, au.email_confirmed_at), u.phone_verified_at,
  least(coalesce(u.created_at, au.created_at), au.created_at), now()
from _identity_pairs p
join public.users u on u.id = p.legacy_id
join auth.users au on au.id = p.auth_id
on conflict (id) do nothing;

do $$
declare
  fk record;
  pair record;
begin
  for fk in
    select tc.table_name, kcu.column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
     and tc.constraint_schema = kcu.constraint_schema
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_name = tc.constraint_name
     and ccu.constraint_schema = tc.constraint_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and tc.table_schema = 'public'
      and ccu.table_schema = 'public'
      and ccu.table_name = 'users'
      and ccu.column_name = 'id'
  loop
    for pair in select legacy_id, auth_id from _identity_pairs loop
      execute format('update public.%I set %I = $1 where %I = $2', fk.table_name, fk.column_name, fk.column_name)
      using pair.auth_id, pair.legacy_id;
    end loop;
  end loop;
end $$;

delete from public.user_roles legacy
using _identity_pairs p
where legacy.user_id = p.legacy_id
  and exists (
    select 1 from public.user_roles canonical
    where canonical.user_id = p.auth_id
      and canonical.role_id = legacy.role_id
  );

update public.user_roles ur
set user_id = p.auth_id
from _identity_pairs p
where ur.user_id = p.legacy_id;

delete from public.users u
using _identity_pairs p
where u.id = p.legacy_id;

insert into public.users (
  id, email, password_hash, first_name, last_name, middle_name,
  is_verified, is_active, email_verified_at, created_at, updated_at
)
select
  au.id,
  au.email,
  null,
  coalesce(au.raw_user_meta_data->>'first_name', ''),
  coalesce(au.raw_user_meta_data->>'last_name', ''),
  nullif(au.raw_user_meta_data->>'middle_name', ''),
  au.email_confirmed_at is not null,
  true,
  au.email_confirmed_at,
  au.created_at,
  now()
from auth.users au
left join public.users u on u.id = au.id
where u.id is null
on conflict (email) do nothing;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  role_id_value uuid;
begin
  insert into public.users (
    id, email, password_hash, first_name, last_name, middle_name,
    is_verified, is_active, email_verified_at, created_at, updated_at
  ) values (
    new.id, new.email, null,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    nullif(new.raw_user_meta_data->>'middle_name', ''),
    new.email_confirmed_at is not null, true, new.email_confirmed_at,
    new.created_at, now()
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    middle_name = excluded.middle_name,
    is_verified = excluded.is_verified,
    email_verified_at = excluded.email_verified_at,
    updated_at = now();

  insert into public.profiles (id, email, first_name, last_name, middle_name)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    nullif(new.raw_user_meta_data->>'middle_name', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    middle_name = excluded.middle_name;

  requested_role := lower(coalesce(new.raw_user_meta_data->>'role', 'student'));
  if requested_role not in ('student', 'teacher', 'parent') then
    requested_role := 'student';
  end if;

  select id into role_id_value from public.roles where name = requested_role limit 1;
  if role_id_value is null then
    select id into role_id_value from public.roles where name = 'student' limit 1;
  end if;

  if role_id_value is not null then
    insert into public.user_roles (user_id, role_id)
    values (new.id, role_id_value)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

commit;
