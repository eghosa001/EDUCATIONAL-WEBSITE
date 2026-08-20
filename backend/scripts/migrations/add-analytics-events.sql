-- Analytics events tracking table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'event',
  event_name VARCHAR(100),
  screen_name VARCHAR(200),
  parameters JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);

-- Analytics user properties table
CREATE TABLE IF NOT EXISTS analytics_user_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  properties JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
