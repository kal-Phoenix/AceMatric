-- ============================================================
-- Migration: Create payment_requests table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_requests (
  id           TEXT PRIMARY KEY,
  user_email   TEXT NOT NULL,
  user_name    TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cbe', 'telebirr', 'abyssinia')),
  amount       INTEGER NOT NULL DEFAULT 199,
  transaction_ref TEXT NOT NULL,
  screenshot_url  TEXT NOT NULL,
  screenshot_path TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes  TEXT DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at  TIMESTAMPTZ
);

-- Index for admin queries (filter by status)
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests (status);

-- Index for user queries (own payments)
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_email ON payment_requests (user_email);

-- Index for admin listing (newest first)
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON payment_requests (created_at DESC);

-- ============================================================
-- Row Level Security (RLS) — optional but recommended
-- ============================================================

ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own payments
CREATE POLICY "Users can view own payments"
  ON payment_requests FOR SELECT
  USING (auth.uid()::text = user_email OR user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Users can insert their own payments
CREATE POLICY "Users can submit own payments"
  ON payment_requests FOR INSERT
  WITH CHECK (auth.uid()::text = user_email OR user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- ============================================================
-- Grant permissions for service_role (backend API)
-- ============================================================

GRANT ALL ON payment_requests TO service_role;
GRANT ALL ON payment_requests TO anon;
