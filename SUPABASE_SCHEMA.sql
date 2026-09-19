-- =========================================================
-- SkillSwap Supabase Database Schema & RLS Policies
-- Paste and run this in Supabase Dashboard -> SQL Editor
-- =========================================================

create extension if not exists "uuid-ossp";

-- 1. Users Table
create table if not exists public.users (
  id text primary key,
  name text,
  email text,
  phone text,
  avatar text,
  title text,
  bio text,
  location text,
  rating numeric default 5.0,
  "timeCredits" numeric default 5.0,
  "escrowLockedCredits" numeric default 0,
  "hoursTaught" numeric default 0,
  "hoursLearned" numeric default 0,
  "completedSessionsCount" int default 0,
  "userReviewCount" int default 0,
  badges jsonb default '["Early Pioneer", "Verified Learner"]'::jsonb,
  "skillsOffered" jsonb default '[]'::jsonb,
  "skillsNeeded" jsonb default '[]'::jsonb,
  "skillsDesired" jsonb default '[]'::jsonb,
  "skillsWanted" jsonb default '[]'::jsonb,
  "responseTime" text,
  "joinedDate" text default 'Recently',
  "createdAt" text,
  "updatedAt" text,
  raw_data jsonb default '{}'::jsonb
);

-- 2. Skills Table
create table if not exists public.skills (
  id text primary key default gen_random_uuid()::text,
  "userId" text references public.users(id) on delete cascade,
  title text,
  category text,
  description text,
  level text,
  delivery text,
  "swapType" text,
  type text default 'offer',
  "hourlyRateCredits" numeric default 1,
  "userName" text,
  "userAvatar" text,
  "userRating" numeric default 5.0,
  "userLocation" text,
  tags jsonb default '[]'::jsonb,
  "skillsDesiredInReturn" jsonb default '[]'::jsonb,
  availability jsonb default '[]'::jsonb,
  "learningObjectives" jsonb default '[]'::jsonb,
  image text,
  featured boolean default false,
  verified boolean default true,
  "isActive" boolean default true,
  "createdAt" text,
  "updatedAt" text,
  raw_data jsonb default '{}'::jsonb
);

-- 3. Proposals Table
create table if not exists public.proposals (
  id text primary key default gen_random_uuid()::text,
  "participantIds" text[],
  "senderId" text,
  "senderName" text,
  "senderAvatar" text,
  "recipientId" text,
  "recipientName" text,
  "recipientAvatar" text,
  "offeredSkillTitle" text,
  "requestedSkillTitle" text,
  status text default 'pending',
  "proposedDate" text,
  "proposedTime" text,
  "durationMinutes" int default 60,
  "pitchMessage" text,
  "useTimeCredits" boolean default false,
  "timeCreditsAmount" numeric default 0,
  "createdAt" text,
  "updatedAt" text,
  raw_data jsonb default '{}'::jsonb
);

-- 4. Sessions Table
create table if not exists public.sessions (
  id text primary key default gen_random_uuid()::text,
  "swapProposalId" text,
  title text,
  "mentorName" text,
  "mentorAvatar" text,
  "mentorId" text,
  "learnerName" text,
  "learnerAvatar" text,
  "learnerId" text,
  "participantIds" text[],
  "skillTitle" text,
  date text,
  time text,
  "durationMinutes" int default 60,
  status text default 'scheduled',
  "meetingUrl" text,
  agenda jsonb default '[]'::jsonb,
  notes text,
  "escrowId" text,
  "timeCreditsEscrowed" numeric default 0,
  "learnerRating" numeric,
  "learnerFeedback" text,
  "createdAt" text,
  "updatedAt" text,
  "completedAt" text,
  "cancelledAt" text,
  raw_data jsonb default '{}'::jsonb
);

-- 5. Messages Table
create table if not exists public.messages (
  id text primary key default gen_random_uuid()::text,
  "swapProposalId" text,
  "senderId" text,
  "senderName" text,
  "senderAvatar" text,
  "recipientId" text,
  "participantIds" text[],
  message text,
  timestamp text,
  "isSystem" boolean default false,
  "createdAt" text,
  raw_data jsonb default '{}'::jsonb
);

-- 6. Reviews Table
create table if not exists public.reviews (
  id text primary key default gen_random_uuid()::text,
  "skillId" text,
  "authorId" text,
  "authorName" text,
  "authorAvatar" text,
  rating numeric default 5,
  comment text,
  date text,
  "skillTitle" text,
  "createdAt" text,
  raw_data jsonb default '{}'::jsonb
);

-- 7. Escrow Transactions Table
create table if not exists public."escrowTransactions" (
  id text primary key default gen_random_uuid()::text,
  "proposalId" text,
  "sessionId" text,
  "learnerId" text,
  "learnerName" text,
  "mentorId" text,
  "mentorName" text,
  "skillTitle" text,
  amount numeric default 0,
  currency text default 'credits',
  status text default 'LOCKED',
  "lockedAt" text,
  "releasedAt" text,
  "refundedAt" text,
  "disputeReason" text,
  raw_data jsonb default '{}'::jsonb
);

-- 8. Pending Payments Table
create table if not exists public."pendingPayments" (
  id text primary key,
  "userId" text,
  gateway text,
  "gatewayRef" text,
  "packageId" text,
  amount numeric,
  "creditHours" numeric,
  currency text,
  status text default 'pending',
  "gatewayReceipt" text,
  "failReason" text,
  "createdAt" text,
  "completedAt" text,
  "failedAt" text,
  raw_data jsonb default '{}'::jsonb
);

-- 9. Transactions Ledger Table
create table if not exists public.transactions (
  id text primary key default gen_random_uuid()::text,
  "userId" text,
  gateway text,
  "gatewayRef" text,
  amount numeric,
  credits numeric,
  currency text,
  status text default 'SUCCESS',
  "createdAt" text,
  raw_data jsonb default '{}'::jsonb
);

-- 10. Stripe Idempotency Ledger
create table if not exists public.stripe_events (
  id text primary key,
  type text,
  "sessionId" text,
  "processedAt" text default now()::text
);

-- 11. Notifications Table
create table if not exists public.notifications (
  id text primary key default gen_random_uuid()::text,
  "recipientUserId" text,
  title text,
  message text,
  type text,
  read boolean default false,
  "createdAt" text,
  raw_data jsonb default '{}'::jsonb
);

-- 12. WebRTC Signaling Rooms
create table if not exists public."webrtcRooms" (
  id text primary key,
  "participantIds" text[],
  offer jsonb,
  answer jsonb,
  candidates jsonb default '[]'::jsonb,
  "updatedAt" text,
  raw_data jsonb default '{}'::jsonb
);

-- Enable Row Level Security (RLS)
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

-- Client-side Policies (service_role bypasses RLS automatically)
drop policy if exists "Allow read users" on public.users;
create policy "Allow read users" on public.users for select using (true);
drop policy if exists "Allow upsert users" on public.users;
create policy "Allow upsert users" on public.users for all using (true) with check (true);

drop policy if exists "Allow read skills" on public.skills;
create policy "Allow read skills" on public.skills for select using (true);
drop policy if exists "Allow manage skills" on public.skills;
create policy "Allow manage skills" on public.skills for all using (true) with check (true);

drop policy if exists "Allow manage proposals" on public.proposals;
create policy "Allow manage proposals" on public.proposals for all using (true) with check (true);

drop policy if exists "Allow manage sessions" on public.sessions;
create policy "Allow manage sessions" on public.sessions for all using (true) with check (true);

drop policy if exists "Allow manage messages" on public.messages;
create policy "Allow manage messages" on public.messages for all using (true) with check (true);

drop policy if exists "Allow manage reviews" on public.reviews;
create policy "Allow manage reviews" on public.reviews for all using (true) with check (true);

drop policy if exists "Allow manage notifications" on public.notifications;
create policy "Allow manage notifications" on public.notifications for all using (true) with check (true);

drop policy if exists "Allow manage webrtc" on public."webrtcRooms";
create policy "Allow manage webrtc" on public."webrtcRooms" for all using (true) with check (true);

-- Enable Replica Identity for full realtime payloads on updates & deletes
alter table public.users replica identity full;
alter table public.skills replica identity full;
alter table public.proposals replica identity full;
alter table public.sessions replica identity full;
alter table public.messages replica identity full;
alter table public.reviews replica identity full;
alter table public.notifications replica identity full;

-- Compatibility Views (allows both camelCase and snake_case queries)
create or replace view public.escrow_transactions as select * from public."escrowTransactions";
create or replace view public.pending_payments as select * from public."pendingPayments";
create or replace view public.webrtc_rooms as select * from public."webrtcRooms";

-- Enable Supabase Realtime Publication safely (idempotent, won't error if publication already exists)
do $$
declare
  t text;
  tables text[] := array['users', 'skills', 'proposals', 'sessions', 'messages', 'reviews', 'notifications'];
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array tables loop
    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

