begin;

create or replace function public.handle_auth_user_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set email = new.email,
      first_name = coalesce(new.raw_user_meta_data->>'first_name', first_name, ''),
      last_name = coalesce(new.raw_user_meta_data->>'last_name', last_name, ''),
      middle_name = coalesce(nullif(new.raw_user_meta_data->>'middle_name', ''), middle_name),
      is_verified = new.email_confirmed_at is not null,
      email_verified_at = new.email_confirmed_at,
      updated_at = now()
  where id = new.id;

  update public.profiles
  set email = new.email,
      first_name = coalesce(new.raw_user_meta_data->>'first_name', first_name, ''),
      last_name = coalesce(new.raw_user_meta_data->>'last_name', last_name, ''),
      middle_name = coalesce(nullif(new.raw_user_meta_data->>'middle_name', ''), middle_name),
      updated_at = now()
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, email_confirmed_at, raw_user_meta_data on auth.users
for each row execute function public.handle_auth_user_update();

update public.users u
set is_verified = au.email_confirmed_at is not null,
    email_verified_at = au.email_confirmed_at,
    updated_at = now()
from auth.users au
where u.id = au.id
  and (u.is_verified is distinct from (au.email_confirmed_at is not null)
       or u.email_verified_at is distinct from au.email_confirmed_at);

commit;
