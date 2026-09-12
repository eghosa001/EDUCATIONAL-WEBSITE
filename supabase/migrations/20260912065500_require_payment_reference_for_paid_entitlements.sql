create or replace function public.enforce_paid_subscription_reference()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_price numeric;
begin
  select price into plan_price from public.subscription_plans where id = new.plan_id;
  if coalesce(plan_price, 0) > 0
     and new.status in ('active', 'trialing')
     and nullif(btrim(coalesce(new.gateway_subscription_id, '')), '') is null then
    raise exception 'Paid subscription entitlement requires a verified gateway reference';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_paid_subscription_reference_trigger on public.subscriptions;
create trigger enforce_paid_subscription_reference_trigger
before insert or update of plan_id, status, gateway_subscription_id on public.subscriptions
for each row execute function public.enforce_paid_subscription_reference();
