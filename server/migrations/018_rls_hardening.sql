-- 018: RLS hardening
--
-- Background
-- ----------
-- Previously every server route ran with the anon-key client and Row Level
-- Security was never enabled on any table. A leaked SUPABASE_ANON_KEY therefore
-- granted full read/write access to every table, including users_auth
-- (password hashes, refresh tokens), payment_requests and all study content.
--
-- The server has now been migrated to use the service-role client for every
-- route (see db.ts and all /server/routes), and all authorization is enforced
-- in server code. This means the anon key is no longer used for data access.
--
-- This migration:
--   1. Enables RLS on every table in the public schema.
--   2. Revokes ALL privileges (schema usage + table, sequence and function
--      privileges) from the `anon` and `authenticated` roles.
--   3. Revokes the default PUBLIC grants so future tables can't be auto-exposed.
--
-- After this runs, if SUPABASE_ANON_KEY leaks it is inert: any REST query made
-- with it fails with permission denied. The service-role client (server-only)
-- continues to work.
--
-- IMPORTANT: Deploy the service-role server code FIRST, then run this migration
-- in the Supabase SQL editor. Do not run it while the old anon-based server is
-- still the one that's deployed.

begin;

-- 1. Enable RLS on every table in the public schema (idempotent).
do $$
declare
  t record;
begin
  for t in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- 2. Revoke schema usage — anon/authenticated can no longer see the schema.
revoke all on schema public from anon, authenticated, public;

-- 3. Revoke privileges on all existing objects, and defaults for future ones.
revoke all on all tables in schema public from anon, authenticated, public;
revoke all on all sequences in schema public from anon, authenticated, public;
revoke all on all functions in schema public from anon, authenticated, public;

-- Future tables/sequences/functions created by the owner of the DB (postgres)
-- will not be auto-granted to anon/authenticated/public either.
alter default privileges in schema public
  revoke all on tables from anon, authenticated, public;
alter default privileges in schema public
  revoke all on sequences from anon, authenticated, public;
alter default privileges in schema public
  revoke all on functions from anon, authenticated, public;

commit;

-- ---------------------------------------------------------------------------
-- Verification:
--
--   select tablename, rowsecurity
--   from pg_tables where schemaname = 'public'
--   order by tablename;
--   --> rowsecurity should be 'true' for every row.
--
--   -- As a POSTGREST API call with the anon key, any of the following must
--   -- return 401/403:
--   --   GET  /rest/v1/student_profiles   (or any other table)
--   --   POST /rest/v1/users_auth
-- ---------------------------------------------------------------------------
--
-- Restoring anon access (NOT recommended) if it is ever needed again:
--
--   grant usage on schema public to anon, authenticated;
--   grant all on all tables in schema public to anon, authenticated;
--   grant all on all sequences in schema public to anon, authenticated;
--   alter default privileges in schema public
--     grant all on tables to anon, authenticated;
--   alter default privileges in schema public
--     grant all on sequences to anon, authenticated;