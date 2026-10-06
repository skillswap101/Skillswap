-- ============================================================================
-- SkillSwap Migration 004: Comprehensive Schema Normalization, Atomic Escrow RPCs,
-- and Table Deduplication
-- ============================================================================
begin;

-- 1. Messages Schema Normalization
alter table public.messages add column if not exists "senderId" text;
alter table public.messages add column if not exists "recipientId" text;
alter table public.messages add column if not exists "swapProposalId" text;
alter table public.messages add column if not exists "participantIds" text[];
alter table public.messages add column if not exists "senderName" text;
alter table public.messages add column if not exists "senderAvatar" text;
alter table public.messages add column if not exists "createdAt" text;
alter table public.messages add column if not exists "read" boolean default false;
alter table public.messages add column if not exists "isSystem" boolean default false;

-- Safe dynamic sync of existing message rows
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'messages' and column_name = 'sender_id') then
    execute 'update public.messages set "senderId" = coalesce("senderId", sender_id) where "senderId" is null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'messages' and column_name = 'receiver_id') then
    execute 'update public.messages set "recipientId" = coalesce("recipientId", receiver_id) where "recipientId" is null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'messages' and column_name = 'created_at') then
    execute 'update public.messages set "createdAt" = coalesce("createdAt", created_at::text) where "createdAt" is null';
  end if;
end $$;


-- 2. Sessions Schema Normalization
alter table public.sessions add column if not exists "mentorId" text;
alter table public.sessions add column if not exists "learnerId" text;
alter table public.sessions add column if not exists "mentorName" text;
alter table public.sessions add column if not exists "mentorAvatar" text;
alter table public.sessions add column if not exists "learnerName" text;
alter table public.sessions add column if not exists "learnerAvatar" text;
alter table public.sessions add column if not exists "swapProposalId" text;
alter table public.sessions add column if not exists "participantIds" text[];
alter table public.sessions add column if not exists "createdAt" text;
alter table public.sessions add column if not exists "updatedAt" text;

-- Safe dynamic sync of existing session rows
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'sessions' and column_name = 'host_id') then
    execute 'update public.sessions set "mentorId" = coalesce("mentorId", host_id) where "mentorId" is null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'sessions' and column_name = 'attendee_id') then
    execute 'update public.sessions set "learnerId" = coalesce("learnerId", attendee_id) where "learnerId" is null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'sessions' and column_name = 'created_at') then
    execute 'update public.sessions set "createdAt" = coalesce("createdAt", created_at::text) where "createdAt" is null';
  end if;
end $$;


-- 3. Reviews Schema Normalization
alter table public.reviews add column if not exists "authorId" text;
alter table public.reviews add column if not exists "authorName" text;
alter table public.reviews add column if not exists "authorAvatar" text;
alter table public.reviews add column if not exists "skillId" text;
alter table public.reviews add column if not exists "skillTitle" text;
alter table public.reviews add column if not exists "createdAt" text;

-- Safe dynamic sync of existing review rows
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'reviews' and column_name = 'reviewer_id') then
    execute 'update public.reviews set "authorId" = coalesce("authorId", reviewer_id) where "authorId" is null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'reviews' and column_name = 'created_at') then
    execute 'update public.reviews set "createdAt" = coalesce("createdAt", created_at::text) where "createdAt" is null';
  end if;
end $$;


-- 4. Proposals Schema Normalization
alter table public.proposals add column if not exists "senderId" text;
alter table public.proposals add column if not exists "recipientId" text;
alter table public.proposals add column if not exists "participantIds" text[];

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'proposals' and column_name = 'sender_id') then
    execute 'update public.proposals set "senderId" = coalesce("senderId", sender_id) where "senderId" is null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'proposals' and column_name = 'receiver_id') then
    execute 'update public.proposals set "recipientId" = coalesce("recipientId", receiver_id) where "recipientId" is null';
  end if;
end $$;


-- 5. Safe Deduplication & View Aliasing for Backward Compatibility
drop table if exists public.pending_payments cascade;
drop table if exists public.listings cascade;
drop table if exists public.swaps cascade;
drop table if exists public.profiles cascade;

-- Aliasing views so any legacy query targeting listings, swaps, or profiles works seamlessly
create or replace view public.listings as select * from public.skills;
create or replace view public.swaps as select * from public.proposals;
create or replace view public.profiles as select * from public.users;

-- Clean up any obsolete fulfill_pending_payment function overloads safely
drop function if exists public.fulfill_pending_payment(text);
drop function if exists public.fulfill_pending_payment(text, text, numeric);


-- 6. Atomic Financial Escrow Stored Procedures
-- A. lock_escrow_credits
create or replace function public.lock_escrow_credits(
  p_proposal_id text,
  p_learner_id text,
  p_mentor_id text,
  p_amount numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  learner_row public.users%rowtype;
  new_balance numeric;
  new_locked numeric;
  escrow_id text;
begin
  if p_amount <= 0 then
    return jsonb_build_object('success', true, 'escrowId', null, 'message', 'Zero credit amount swap accepted');
  end if;

  -- Lock learner row to prevent concurrent double-spending
  select * into learner_row from public.users where id = p_learner_id for update;
  if not found then
    raise exception 'Learner user % not found', p_learner_id;
  end if;

  if coalesce(learner_row."timeCredits", 0) < p_amount then
    return jsonb_build_object('success', false, 'error', 'INSUFFICIENT_CREDITS', 'message', 'Learner does not have enough time credits');
  end if;

  new_balance := coalesce(learner_row."timeCredits", 0) - p_amount;
  new_locked := coalesce(learner_row."escrowLockedCredits", 0) + p_amount;

  update public.users
  set "timeCredits" = new_balance,
      "escrowLockedCredits" = new_locked,
      "updatedAt" = now()::text
  where id = p_learner_id;

  escrow_id := 'escrow_' || gen_random_uuid()::text;

  insert into public."escrowTransactions" (
    id, "proposalId", "learnerId", "mentorId", amount, currency, status, "lockedAt"
  ) values (
    escrow_id, p_proposal_id, p_learner_id, p_mentor_id, p_amount, 'credits', 'LOCKED', now()::text
  );

  update public.proposals
  set status = 'accepted', "updatedAt" = now()::text
  where id = p_proposal_id;

  return jsonb_build_object('success', true, 'escrowId', escrow_id, 'message', 'Credits locked in escrow successfully');
end;
$$;

-- B. release_escrow_credits
create or replace function public.release_escrow_credits(
  p_session_id text,
  p_escrow_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  escrow_row public."escrowTransactions"%rowtype;
  mentor_row public.users%rowtype;
  learner_row public.users%rowtype;
begin
  if p_escrow_id is null or p_escrow_id = '' then
    return jsonb_build_object('success', true, 'message', 'No escrow associated with session');
  end if;

  select * into escrow_row from public."escrowTransactions" where id = p_escrow_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'ESCROW_NOT_FOUND', 'message', 'Escrow transaction not found');
  end if;

  if escrow_row.status = 'RELEASED' then
    return jsonb_build_object('success', true, 'message', 'Escrow already released (idempotent)');
  end if;

  if escrow_row.status <> 'LOCKED' then
    return jsonb_build_object('success', false, 'error', 'INVALID_STATUS', 'message', 'Escrow is not in LOCKED status');
  end if;

  -- Lock mentor row
  select * into mentor_row from public.users where id = escrow_row."mentorId" for update;
  if not found then
    raise exception 'Mentor user % not found', escrow_row."mentorId";
  end if;

  -- Lock learner row
  select * into learner_row from public.users where id = escrow_row."learnerId" for update;
  if not found then
    raise exception 'Learner user % not found', escrow_row."learnerId";
  end if;

  -- Transfer credits
  update public.users
  set "timeCredits" = coalesce("timeCredits", 0) + escrow_row.amount,
      "hoursTaught" = coalesce("hoursTaught", 0) + 1,
      "completedSessionsCount" = coalesce("completedSessionsCount", 0) + 1,
      "updatedAt" = now()::text
  where id = escrow_row."mentorId";

  update public.users
  set "escrowLockedCredits" = greatest(0, coalesce("escrowLockedCredits", 0) - escrow_row.amount),
      "hoursLearned" = coalesce("hoursLearned", 0) + 1,
      "completedSessionsCount" = coalesce("completedSessionsCount", 0) + 1,
      "updatedAt" = now()::text
  where id = escrow_row."learnerId";

  update public."escrowTransactions"
  set status = 'RELEASED', "releasedAt" = now()::text, "sessionId" = p_session_id
  where id = escrow_row.id;

  update public.sessions
  set status = 'completed', "completedAt" = now()::text, "updatedAt" = now()::text
  where id = p_session_id;

  -- Ledger transaction record
  insert into public.transactions (
    id, "userId", gateway, "gatewayRef", amount, credits, currency, status, "createdAt"
  ) values (
    'tx_escrow_' || gen_random_uuid()::text,
    escrow_row."mentorId",
    'escrow',
    escrow_row.id,
    escrow_row.amount,
    escrow_row.amount,
    'credits',
    'completed',
    now()::text
  );

  return jsonb_build_object('success', true, 'message', 'Escrow credits released to mentor');
end;
$$;

-- C. refund_escrow_credits
create or replace function public.refund_escrow_credits(
  p_escrow_id text,
  p_reason text default 'Session cancelled or dispute resolved'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  escrow_row public."escrowTransactions"%rowtype;
  learner_row public.users%rowtype;
begin
  select * into escrow_row from public."escrowTransactions" where id = p_escrow_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'ESCROW_NOT_FOUND', 'message', 'Escrow record not found');
  end if;

  if escrow_row.status = 'REFUNDED' then
    return jsonb_build_object('success', true, 'message', 'Escrow already refunded (idempotent)');
  end if;

  if escrow_row.status <> 'LOCKED' then
    return jsonb_build_object('success', false, 'error', 'INVALID_STATUS', 'message', 'Only LOCKED escrow can be refunded');
  end if;

  select * into learner_row from public.users where id = escrow_row."learnerId" for update;
  if not found then
    raise exception 'Learner % not found', escrow_row."learnerId";
  end if;

  update public.users
  set "timeCredits" = coalesce("timeCredits", 0) + escrow_row.amount,
      "escrowLockedCredits" = greatest(0, coalesce("escrowLockedCredits", 0) - escrow_row.amount),
      "updatedAt" = now()::text
  where id = escrow_row."learnerId";

  update public."escrowTransactions"
  set status = 'REFUNDED', "refundedAt" = now()::text, "disputeReason" = p_reason
  where id = escrow_row.id;

  return jsonb_build_object('success', true, 'message', 'Escrow credits refunded to learner');
end;
$$;

-- Restrict RPC permissions to service_role only (fail closed)
revoke all on function public.lock_escrow_credits(text, text, text, numeric) from public, anon, authenticated;
grant execute on function public.lock_escrow_credits(text, text, text, numeric) to service_role;

revoke all on function public.release_escrow_credits(text, text) from public, anon, authenticated;
grant execute on function public.release_escrow_credits(text, text) to service_role;

revoke all on function public.refund_escrow_credits(text, text) from public, anon, authenticated;
grant execute on function public.refund_escrow_credits(text, text) to service_role;

commit;
