-- ============================================================
-- Migration: Create users_auth table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

CREATE TABLE IF NOT EXISTS users_auth (
  email           TEXT PRIMARY KEY,
  password        TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recovery_code   TEXT,
  recovery_expiry BIGINT
);

-- ============================================================
-- Row Level Security (RLS) — disable for service_role backend
-- ============================================================

ALTER TABLE users_auth ENABLE ROW LEVEL SECURITY;

-- Service role bypass
CREATE POLICY "Service role full access"
  ON users_auth FOR ALL
  USING (auth.role() = 'service_role');

-- Allow anon inserts for signup (optional, can also use service_role)
CREATE POLICY "Allow signup inserts"
  ON users_auth FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Grant permissions
-- ============================================================

GRANT ALL ON users_auth TO service_role;
GRANT INSERT ON users_auth TO anon;
