-- SkillSwap Migration 002: Comprehensive Production Security, RLS, Storage, and Realtime Integrity
begin;

-- 1. Schema Extensions & Column Additions
alter table public.messages add column if not exists "read" boolean default false;
alter table public.messages add column if not exists "recipientId" text;
alter table public.messages add column if not exists "participantIds" text[];
alter table public.messages add column if not exists "createdAt" text;

alter table public.users add column if not exists "timeCredits" numeric default 10;
alter table public.users add column if not exists "escrowLockedCredits" numeric default 0;

-- 2. Idempotency & Unique Indexes for Financial Tables
create unique index if not exists
  idx_transactions_gateway_ref_unique
on public.transactions (gateway, "gatewayRef")
where "gatewayRef" is not null;

create unique index if not exists
  idx_pending_payments_gateway_ref_unique
on public."pendingPayments" (gateway, "gatewayRef")
where gateway is not null
  and "gatewayRef" is not null;

create index if not exists idx_messages_recipient_read on public.messages ("recipientId", "read");
create index if not exists idx_messages_participants on public.messages using gin ("participantIds");
create index if not exists idx_proposals_participants on public.proposals using gin ("participantIds");
create index if not exists idx_sessions_participants_gin on public.sessions using gin ("participantIds");

-- 3. Storage Bucket Configuration for User Profile Avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 4. Enable Row Level Security Across All Core Relations
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

-- 5. Drop Permissive Legacy Policies
do $$ 
declare 
  t text; 
  p record; 
begin 
  foreach t in array ARRAY[
    'users','skills','proposals','sessions','messages','reviews', 
    'notifications','transactions','escrowTransactions','pendingPayments'
  ] 
  loop 
    for p in select polname from pg_policy where polrelid = to_regclass('public.' || quote_ident(t)) 
    loop 
      execute format('drop policy if exists %I on public.%I', p.polname, t); 
    end loop; 
  end loop; 
end $$;

-- 6. Granular, Secure Client RLS Policies
-- Users: Public read of profiles; users can only modify their own row
create policy "users_select_public" on public.users 
  for select using (true);

create policy "users_insert_self" on public.users 
  for insert with check (auth.uid()::text = id);

create policy "users_update_self" on public.users 
  for update using (auth.uid()::text = id) with check (auth.uid()::text = id);

-- Skills: Public marketplace read; owners can insert/update/delete
create policy "skills_select_public" on public.skills 
  for select using (true);

create policy "skills_insert_owner" on public.skills 
  for insert with check (auth.uid()::text = "userId");

create policy "skills_update_owner" on public.skills 
  for update using (auth.uid()::text = "userId") with check (auth.uid()::text = "userId");

create policy "skills_delete_owner" on public.skills 
  for delete using (auth.uid()::text = "userId");

-- Messages: Only participants can read; only sender can insert
create policy "messages_select_participants" on public.messages 
  for select using (
    auth.uid()::text = "senderId" or 
    auth.uid()::text = "recipientId" or 
    (auth.uid()::text = any("participantIds"))
  );

create policy "messages_insert_sender" on public.messages 
  for insert with check (auth.uid()::text = "senderId");

create policy "messages_update_read" on public.messages 
  for update using (
    auth.uid()::text = "recipientId" or 
    auth.uid()::text = "senderId"
  );

-- Proposals: Scoped to sender and recipient
create policy "proposals_select_participants" on public.proposals 
  for select using (
    auth.uid()::text = "senderId" or 
    auth.uid()::text = "recipientId" or 
    (auth.uid()::text = any("participantIds"))
  );

create policy "proposals_insert_sender" on public.proposals 
  for insert with check (auth.uid()::text = "senderId");

create policy "proposals_update_participants" on public.proposals 
  for update using (
    auth.uid()::text = "senderId" or 
    auth.uid()::text = "recipientId"
  );

-- Sessions: Scoped to mentor and learner
create policy "sessions_select_participants" on public.sessions 
  for select using (
    auth.uid()::text = "mentorId" or 
    auth.uid()::text = "learnerId" or 
    (auth.uid()::text = any("participantIds"))
  );

create policy "sessions_insert_participants" on public.sessions 
  for insert with check (
    auth.uid()::text = "mentorId" or 
    auth.uid()::text = "learnerId"
  );

create policy "sessions_update_participants" on public.sessions 
  for update using (
    auth.uid()::text = "mentorId" or 
    auth.uid()::text = "learnerId"
  );

-- Notifications: Strictly scoped to recipient
create policy "notifications_select_recipient" on public.notifications 
  for select using (auth.uid()::text = "recipientUserId");

create policy "notifications_update_recipient" on public.notifications 
  for update using (auth.uid()::text = "recipientUserId");

create policy "notifications_delete_recipient" on public.notifications 
  for delete using (auth.uid()::text = "recipientUserId");

-- Reviews: Public read; authors can create
create policy "reviews_select_public" on public.reviews 
  for select using (true);

create policy "reviews_insert_author" on public.reviews 
  for insert with check (auth.uid()::text = "authorId");

-- Financial Tables: Select own transactions only; MUTATIONS STRICTLY RESTRICTED TO SERVICE_ROLE
create policy "transactions_select_owner" on public.transactions 
  for select using (auth.uid()::text = "userId");

create policy "escrow_select_participants" on public."escrowTransactions" 
  for select using (
    auth.uid()::text = "learnerId" or 
    auth.uid()::text = "mentorId"
  );

create policy "pending_payments_select_owner" on public."pendingPayments" 
  for select using (auth.uid()::text = "userId");

-- 7. Storage Policies for Avatars Bucket
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'storage' and tablename = 'objects') then
    drop policy if exists "avatars_public_select" on storage.objects;
    create policy "avatars_public_select" on storage.objects 
      for select using (bucket_id = 'avatars');

    drop policy if exists "avatars_user_insert" on storage.objects;
    create policy "avatars_user_insert" on storage.objects 
      for insert with check (
        bucket_id = 'avatars' and 
        (storage.foldername(name))[1] = auth.uid()::text
      );

    drop policy if exists "avatars_user_update" on storage.objects;
    create policy "avatars_user_update" on storage.objects 
      for update using (
        bucket_id = 'avatars' and 
        (storage.foldername(name))[1] = auth.uid()::text
      );

    drop policy if exists "avatars_user_delete" on storage.objects;
    create policy "avatars_user_delete" on storage.objects 
      for delete using (
        bucket_id = 'avatars' and 
        (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;

commit;
