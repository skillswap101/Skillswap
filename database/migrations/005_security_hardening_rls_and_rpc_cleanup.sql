-- ============================================================================
-- SkillSwap Migration 005: Security Hardening, RLS Policies, and RPC Cleanup
-- ============================================================================
begin;

-- 1. Clean up ALL legacy fulfill_pending_payment overloads dynamically
do $$
declare
  r record;
begin
  for r in
    select oid::regprocedure as regproc
    from pg_proc
    where proname = 'fulfill_pending_payment'
      and pronamespace = 'public'::regnamespace
  loop
    execute 'drop function if exists ' || r.regproc || ' cascade';
  end loop;
end $$;

-- 2. Canonical fulfill_pending_payment with fixed search_path = public
create or replace function public.fulfill_pending_payment(
  p_payment_id text,
  p_gateway_receipt text default null
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
    payment_row.id, payment_row."userId", payment_row.gateway, payment_row."gatewayRef",
    payment_row.amount, payment_row."creditHours", payment_row.currency, 'completed', now()::text
  ) on conflict (id) do nothing;

  return true;
end;
$$;

revoke all on function public.fulfill_pending_payment(text, text) from public, anon, authenticated;
grant execute on function public.fulfill_pending_payment(text, text) to service_role;


-- 3. Security Definer Views Cleanup (Convert to Security Invoker)
drop view if exists public.escrow_transactions cascade;
drop view if exists public.webrtc_rooms cascade;

-- Aliased views using standard security_invoker = true
create or replace view public.escrow_transactions with (security_invoker = true) as 
select * from public."escrowTransactions";

create or replace view public.webrtc_rooms with (security_invoker = true) as 
select * from public."webrtcRooms";


-- 4. Row Level Security Policies for the 6 Flagged Tables
-- Helper: Matches authenticated Firebase UID (text) with table columns without uuid type mismatch
-- A. pendingPayments (Owner SELECT, Server full access)
alter table public."pendingPayments" enable row level security;
drop policy if exists "pending_payments_select_owner" on public."pendingPayments";
drop policy if exists "pending_payments_service_role" on public."pendingPayments";

create policy "pending_payments_select_owner" on public."pendingPayments"
  for select using (coalesce(auth.jwt() ->> 'sub', (auth.uid())::text) = "userId");

create policy "pending_payments_service_role" on public."pendingPayments"
  for all to service_role using (true) with check (true);

-- B. transactions (Owner SELECT, Server full access)
alter table public.transactions enable row level security;
drop policy if exists "transactions_select_owner" on public.transactions;
drop policy if exists "transactions_service_role" on public.transactions;

create policy "transactions_select_owner" on public.transactions
  for select using (coalesce(auth.jwt() ->> 'sub', (auth.uid())::text) = "userId");

create policy "transactions_service_role" on public.transactions
  for all to service_role using (true) with check (true);

-- C. escrowTransactions (Participants SELECT, Server full access)
alter table public."escrowTransactions" enable row level security;
drop policy if exists "escrow_select_participant" on public."escrowTransactions";
drop policy if exists "escrow_service_role" on public."escrowTransactions";

create policy "escrow_select_participant" on public."escrowTransactions"
  for select using (
    coalesce(auth.jwt() ->> 'sub', (auth.uid())::text) = "learnerId" 
    or coalesce(auth.jwt() ->> 'sub', (auth.uid())::text) = "mentorId"
  );

create policy "escrow_service_role" on public."escrowTransactions"
  for all to service_role using (true) with check (true);

-- D. stripe_events (Server-only ledger)
alter table public.stripe_events enable row level security;
drop policy if exists "stripe_events_service_role" on public.stripe_events;

create policy "stripe_events_service_role" on public.stripe_events
  for all to service_role using (true) with check (true);

-- E. notifications (Recipient user access)
alter table public.notifications enable row level security;
drop policy if exists "notifications_select_owner" on public.notifications;
drop policy if exists "notifications_update_owner" on public.notifications;
drop policy if exists "notifications_delete_owner" on public.notifications;
drop policy if exists "notifications_service_role" on public.notifications;

create policy "notifications_select_owner" on public.notifications
  for select using (coalesce(auth.jwt() ->> 'sub', (auth.uid())::text) = "recipientUserId");

create policy "notifications_update_owner" on public.notifications
  for update using (coalesce(auth.jwt() ->> 'sub', (auth.uid())::text) = "recipientUserId")
  with check (coalesce(auth.jwt() ->> 'sub', (auth.uid())::text) = "recipientUserId");

create policy "notifications_delete_owner" on public.notifications
  for delete using (coalesce(auth.jwt() ->> 'sub', (auth.uid())::text) = "recipientUserId");

create policy "notifications_service_role" on public.notifications
  for all to service_role using (true) with check (true);

-- F. webrtcRooms (Participants access)
alter table public."webrtcRooms" enable row level security;
drop policy if exists "webrtc_rooms_select_participant" on public."webrtcRooms";
drop policy if exists "webrtc_rooms_insert_participant" on public."webrtcRooms";
drop policy if exists "webrtc_rooms_update_participant" on public."webrtcRooms";
drop policy if exists "webrtc_rooms_service_role" on public."webrtcRooms";

create policy "webrtc_rooms_select_participant" on public."webrtcRooms"
  for select using (coalesce(auth.jwt() ->> 'sub', (auth.uid())::text) = any("participantIds"));

create policy "webrtc_rooms_insert_participant" on public."webrtcRooms"
  for insert with check (coalesce(auth.jwt() ->> 'sub', (auth.uid())::text) = any("participantIds"));

create policy "webrtc_rooms_update_participant" on public."webrtcRooms"
  for update using (coalesce(auth.jwt() ->> 'sub', (auth.uid())::text) = any("participantIds"))
  with check (coalesce(auth.jwt() ->> 'sub', (auth.uid())::text) = any("participantIds"));

create policy "webrtc_rooms_service_role" on public."webrtcRooms"
  for all to service_role using (true) with check (true);

commit;
