-- Consolidate duplicate migration schemas
-- This migration fixes tables that were defined inconsistently across multiple migration files
-- Run ONLY ONCE after all prior migrations have been applied

-- ============================================================================
-- FLASHCARD_REVIEWS: merge init-db schema (spaced repetition) as canonical
-- The add-missing-tables.sql version has rating/repetition_level which we keep
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'flashcard_reviews') THEN
    -- Add missing columns from the spaced-repetition schema if absent
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'flashcard_reviews' AND column_name = 'card_index') THEN
      ALTER TABLE flashcard_reviews ADD COLUMN IF NOT EXISTS card_index INTEGER;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'flashcard_reviews' AND column_name = 'next_review_at') THEN
      ALTER TABLE flashcard_reviews ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'flashcard_reviews' AND column_name = 'review_count') THEN
      ALTER TABLE flashcard_reviews ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'flashcard_reviews' AND column_name = 'easiness_factor') THEN
      ALTER TABLE flashcard_reviews ADD COLUMN IF NOT EXISTS easiness_factor DECIMAL(5,2) DEFAULT 2.5;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STUDY_SESSIONS: ensure canonical columns exist
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'study_sessions') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'study_sessions' AND column_name = 'session_type') THEN
      ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS session_type VARCHAR(50) DEFAULT 'lesson';
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'study_sessions' AND column_name = 'ends_at') THEN
      ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- AUDIT_LOGS: ensure canonical columns exist
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'ip_address') THEN
      ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'user_agent') THEN
      ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- AI_USAGE: ensure canonical columns exist
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_usage') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_usage' AND column_name = 'model') THEN
      ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS model VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_usage' AND column_name = 'prompt_tokens') THEN
      ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_usage' AND column_name = 'completion_tokens') THEN
      ALTER TABLE ai_usage ADD COLUMN IF NOT EXISTS completion_tokens INTEGER DEFAULT 0;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- DOCUMENTS: add missing columns from secondary migrations
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'category') THEN
      ALTER TABLE documents ADD COLUMN IF NOT EXISTS category VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'file_size_bytes') THEN
      ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- PAST_QUESTIONS: ensure canonical columns exist
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'past_questions') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'past_questions' AND column_name = 'exam_board') THEN
      ALTER TABLE past_questions ADD COLUMN IF NOT EXISTS exam_board VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'past_questions' AND column_name = 'year') THEN
      ALTER TABLE past_questions ADD COLUMN IF NOT EXISTS year INTEGER;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- Create unified index for analytics_events if not exists
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);
