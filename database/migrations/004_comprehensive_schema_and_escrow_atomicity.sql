-- ============================================================================
-- SkillSwap Migration 004: Comprehensive Schema Normalization, Atomic Escrow RPCs,
-- and Table Deduplication
-- ============================================================================
begin;

-- 1. Messages Schema Normalization & Bidirectional Sync
alter table public.messages add column if not exists "senderId" text;
alter table public.messages add column if not exists "recipientId" text;
alter table public.messages add column if not exists "swapProposalId" text;
alter table public.messages add column if not exists "participantIds" text[];
alter table public.messages add column if not exists "senderName" text;
alter table public.messages add column if not exists "senderAvatar" text;
alter table public.messages add column if not exists "createdAt" text;
alter table public.messages add column if not exists "read" boolean default false;
alter table public.messages add column if not exists "isSystem" boolean default false;

-- Sync existing rows where snake_case exists
update public.messages set
  "senderId" = coalesce("senderId", sender_id),
  "recipientId" = coalesce("recipientId", receiver_id),
  "createdAt" = coalesce("createdAt", created_at::text)
where "senderId" is null or "recipientId" is null;

-- Trigger to guarantee any insert/update populates both snake_case and camelCase
create or replace function public.sync_messages_columns()
returns trigger language plpgsql as $$
begin
  new."senderId" := coalesce(new."senderId", new.sender_id);
  new.sender_id := coalesce(new.sender_id, new."senderId");
  new."recipientId" := coalesce(new."recipientId", new.receiver_id);
  new.receiver_id := coalesce(new.receiver_id, new."recipientId");
  new."createdAt" := coalesce(new."createdAt", new.created_at::text, now()::text);
  if new."participantIds" is null and new."senderId" is not null and new."recipientId" is not null then
    new."participantIds" := array[new."senderId", new."recipientId"];
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_messages_columns on public.messages;
create trigger trg_sync_messages_columns
before insert or update on public.messages
for each row execute function public.sync_messages_columns();


-- 2. Sessions Schema Normalization & Bidirectional Sync
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

-- Sync existing rows
update public.sessions set
  "mentorId" = coalesce("mentorId", host_id),
  "learnerId" = coalesce("learnerId", attendee_id),
  "createdAt" = coalesce("createdAt", created_at::text)
where "mentorId" is null or "learnerId" is null;

create or replace function public.sync_sessions_columns()
returns trigger language plpgsql as $$
begin
  new."mentorId" := coalesce(new."mentorId", new.host_id);
  new.host_id := coalesce(new.host_id, new."mentorId");
  new."learnerId" := coalesce(new."learnerId", new.attendee_id);
  new.attendee_id := coalesce(new.attendee_id, new."learnerId");
  new."createdAt" := coalesce(new."createdAt", new.created_at::text, now()::text);
  if new."participantIds" is null and new."mentorId" is not null and new."learnerId" is not null then
    new."participantIds" := array[new."mentorId", new."learnerId"];
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_sessions_columns on public.sessions;
create trigger trg_sync_sessions_columns
before insert or update on public.sessions
for each row execute function public.sync_sessions_columns();


-- 3. Reviews Schema Normalization & Bidirectional Sync
alter table public.reviews add column if not exists "authorId" text;
alter table public.reviews add column if not exists "authorName" text;
alter table public.reviews add column if not exists "authorAvatar" text;
alter table public.reviews add column if not exists "skillId" text;
alter table public.reviews add column if not exists "skillTitle" text;
alter table public.reviews add column if not exists "createdAt" text;

update public.reviews set
  "authorId" = coalesce("authorId", reviewer_id),
  "createdAt" = coalesce("createdAt", created_at::text)
where "authorId" is null;

create or replace function public.sync_reviews_columns()
returns trigger language plpgsql as $$
begin
  new."authorId" := coalesce(new."authorId", new.reviewer_id);
  new.reviewer_id := coalesce(new.reviewer_id, new."authorId");
  new."createdAt" := coalesce(new."createdAt", new.created_at::text, now()::text);
  return new;
end;
$$;

drop trigger if exists trg_sync_reviews_columns on public.reviews;
create trigger trg_sync_reviews_columns
before insert or update on public.reviews
for each row execute function public.sync_reviews_columns();


-- 4. Proposals Schema Normalization
alter table public.proposals add column if not exists "senderId" text;
alter table public.proposals add column if not exists "recipientId" text;
alter table public.proposals add column if not exists "participantIds" text[];

create or replace function public.sync_proposals_columns()
returns trigger language plpgsql as $$
begin
  new."senderId" := coalesce(new."senderId", new.sender_id);
  new.sender_id := coalesce(new.sender_id, new."senderId");
  new."recipientId" := coalesce(new."recipientId", new.receiver_id);
  new.receiver_id := coalesce(new.receiver_id, new."recipientId");
  if new."participantIds" is null and new."senderId" is not null and new."recipientId" is not null then
    new."participantIds" := array[new."senderId", new."recipientId"];
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_proposals_columns on public.proposals;
create trigger trg_sync_proposals_columns
before insert or update on public.proposals
for each row execute function public.sync_proposals_columns();


-- 5. Safe Deduplication of Duplicate/Orphan Tables
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'pending_payments') then
    insert into public."pendingPayments" (id, "userId", gateway, "gatewayRef", amount, currency, "creditHours", status, "createdAt")
    select id, "userId", gateway, "gatewayRef", amount, currency, "creditHours", status, "createdAt"
    from public.pending_payments
    on conflict (id) do nothing;
    drop table public.pending_payments;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'listings') then
    if (select count(*) from public.listings) = 0 then
      drop table public.listings;
    end if;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'swaps') then
    if (select count(*) from public.swaps) = 0 then
      drop table public.swaps;
    end if;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    if (select count(*) from public.profiles) = 0 then
      drop table public.profiles;
    end if;
  end if;
end $$;


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
