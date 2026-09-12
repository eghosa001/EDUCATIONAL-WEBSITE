begin;

insert into public.user_roles (user_id, role_id)
select au.id, r.id
from auth.users au
join public.roles r on r.name = case
  when lower(coalesce(au.raw_user_meta_data->>'role','')) in ('student','teacher','parent')
    then lower(au.raw_user_meta_data->>'role')
  else 'student'
end
where not exists (
  select 1 from public.user_roles ur where ur.user_id = au.id
)
on conflict do nothing;

commit;
