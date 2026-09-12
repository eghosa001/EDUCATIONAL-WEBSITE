update public.questions q
set is_active = false,
    updated_at = now()
where q.is_active is distinct from false
  and exists (
    select 1
    from jsonb_array_elements(q.options) option_row
    where coalesce(btrim(option_row->>'id'), '') = ''
       or coalesce(btrim(option_row->>'text'), '') = ''
  );
