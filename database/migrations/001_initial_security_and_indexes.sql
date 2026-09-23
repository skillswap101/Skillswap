-- SkillSwap Migration 001: Security, Indexes, and Atomic Financial RPCs
begin;

-- 1. Index Optimizations for Core Relations
create index if not exists idx_skills_user_category on public.skills ("userId", category);
create index if not exists idx_proposals_sender on public.proposals ("senderId");
create index if not exists idx_proposals_recipient on public.proposals ("recipientId");
create index if not exists idx_proposals_status on public.proposals (status);
create index if not exists idx_sessions_participants on public.sessions ("mentorId", "learnerId", status);
create index if not exists idx_messages_proposal on public.messages ("swapProposalId");
create index if not exists idx_notifications_recipient on public.notifications ("recipientUserId", read);
create index if not exists idx_escrow_proposal on public."escrowTransactions" ("proposalId", status);
create index if not exists idx_pending_payments_user on public."pendingPayments" ("userId", status);

-- 2. Atomic Stored Procedure: fulfill_pending_payment
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

revoke all on function public.fulfill_pending_payment(text, text) from public, anon, authenticated;
grant execute on function public.fulfill_pending_payment(text, text) to service_role;

commit;
