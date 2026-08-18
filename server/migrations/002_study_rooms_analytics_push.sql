-- Study rooms table for persistent room storage
-- Replaces the in-memory studyRooms object
-- NOTE: If an old study_rooms table exists with room_id TEXT PK and allowed_emails TEXT[],
-- this migration will drop and recreate it with the correct schema.

DO $$
BEGIN
  -- Check if old schema exists (room_id column instead of id)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'study_rooms' AND column_name = 'room_id'
  ) THEN
    DROP TABLE study_rooms;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS study_rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  creator_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT DEFAULT '',
  messages JSONB DEFAULT '[]',
  canvas_state JSONB DEFAULT '[]',
  active_quiz JSONB,
  goals JSONB DEFAULT '[]',
  shared_notes TEXT DEFAULT '',
  timer_state JSONB DEFAULT '{"isPlaying":false,"timeLeft":1500,"duration":1500,"lastUpdated":0}',
  allowed_emails JSONB DEFAULT '[]',
  join_requests JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by creator
CREATE INDEX IF NOT EXISTS idx_study_rooms_creator ON study_rooms(creator_email);

-- Analytics table for tracking user study activity
CREATE TABLE IF NOT EXISTS user_analytics (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  subject TEXT,
  score NUMERIC,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_user_analytics_email ON user_analytics(user_email);
CREATE INDEX IF NOT EXISTS idx_user_analytics_type ON user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_user_analytics_created ON user_analytics(created_at);

-- Push subscriptions table for web push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_email, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_email ON push_subscriptions(user_email);
