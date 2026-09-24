-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Add ALL missing columns to users_auth (email verification + account lockout)
ALTER TABLE users_auth
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verification_code TEXT,
  ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_email_verified ON users_auth(email, email_verified);

-- Verify it worked: should show all columns including the new ones
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users_auth'
ORDER BY ordinal_position;
