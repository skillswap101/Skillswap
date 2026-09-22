-- SkillSwap Production Security Migration (GitHub Main Sync)
-- IMPORTANT: Back up your database before execution.

begin;

-- 1. Drop permissive public USING(true) policies across core tables
do $$ 
declare 
  t text; 
  p record; 
begin 
  foreach t in array ARRAY[
    'users','skills','proposals','sessions','messages','reviews', 
    'notifications','webrtcRooms'
  ] 
  loop 
    for p in select polname from pg_policy where polrelid = to_regclass('public.' || quote_ident(t)) 
    loop 
      execute format('drop policy if exists %I on public.%I', p.polname, t); 
    end loop; 
  end loop; 
end $$;

-- 2. Enforce Row Level Security (Deny by default for anon/authenticated direct client writes)
alter table public.users enable row level security;
alter table public.skills enable row level security;
alter table public.proposals enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public."escrowTransactions" enable row level security;
alter table public."pendingPayments" enable row level security;
alter table public.transactions enable row level security;
alter table public.stripe_events enable row level security;
alter table public.notifications enable row level security;
alter table public."webrtcRooms" enable row level security;

-- 3. Create Atomic Payment Fulfillment RPC Function
create or replace function public.fulfill_pending_payment(
  p_payment_id text, 
  p_gateway_receipt text
) 
returns boolean 
language plpgsql 
security definer 
set search_path = public 
as $$ 
declare 
  payment_row public."pendingPayments"%rowtype; 
  user_row public.users%rowtype; 
  new_balance numeric; 
begin 
  select * into payment_row from public."pendingPayments" where id = p_payment_id for update;
  
  if not found then 
    return false; 
  end if;
  
  if payment_row.status <> 'pending' then 
    return false; 
  end if;
  
  select * into user_row from public.users where id = payment_row."userId" for update;
  
  if not found then 
    raise exception 'User % not found', payment_row."userId"; 
  end if;
  
  new_balance := coalesce(user_row."timeCredits", 0) + coalesce(payment_row."creditHours", 0);
  
  update public.users 
  set "timeCredits" = new_balance, "updatedAt" = now()::text 
  where id = payment_row."userId";
  
  update public."pendingPayments" 
  set status = 'completed', "gatewayReceipt" = p_gateway_receipt, "completedAt" = now()::text 
  where id = payment_row.id;
  
  insert into public.transactions (
    id, "userId", gateway, "gatewayRef", amount, credits, currency, status, "createdAt"
  ) values ( 
    gen_random_uuid()::text, payment_row."userId", payment_row.gateway, payment_row."gatewayRef", 
    payment_row.amount, payment_row."creditHours", payment_row.currency, 'SUCCESS', now()::text 
  );
  
  return true; 
end;
$$;

-- Restrict RPC execution strictly to the backend service role
revoke all on function public.fulfill_pending_payment(text, text) from public, anon, authenticated;
grant execute on function public.fulfill_pending_payment(text, text) to service_role;

commit;
