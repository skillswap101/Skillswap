-- SkillSwap Migration 003: Render Free Tier Keep-Awake Cron (pg_cron + pg_net)
-- Render spins down free tier web services after 15 minutes of inactivity.
-- This cron job pings the Render deployment every 12 minutes to keep it warm and prevent cold starts.

-- 1. Ensure required Supabase PostgreSQL extensions are enabled
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Safely unschedule any existing keep-awake cron job with the old URL or parameters
do $$
begin
  if exists (select 1 from cron.job where jobname = 'keep-render-awake') then
    perform cron.unschedule('keep-render-awake');
  end if;
exception
  when others then
    -- Catch any unschedule issues if job is not found or in transition
    null;
end $$;

-- 3. Create the new cron job with the exact hyphenated URL
-- Pings /api/health every 12 minutes (Render checks /api/health and returns { status: "healthy" })
select cron.schedule(
  'keep-render-awake',
  '*/12 * * * *',
  $$ select net.http_get('https://skillswap-0919.onrender.com/api/health') $$
);

-- ============================================================================
-- VERIFICATION & MONITORING QUERIES (Run these in Supabase SQL Editor)
-- ============================================================================
-- 1. Check all scheduled cron jobs:
--    select jobid, jobname, schedule, command, active from cron.job where jobname = 'keep-render-awake';
--
-- 2. Check recent cron run executions:
--    select jobid, runid, job_pid, database, username, command, status, return_message, start_time, end_time
--    from cron.job_run_details
--    where command like '%keep-render-awake%' or command like '%skillswap-0919%'
--    order by start_time desc
--    limit 10;
--
-- 3. Check HTTP request responses via pg_net:
--    select id, status_code, content, error_msg, created
--    from net._http_response
--    order by created desc
--    limit 10;
--
-- 4. To pause/stop the cron job if needed:
--    select cron.unschedule('keep-render-awake');
