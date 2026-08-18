-- Migration: add-past-questions-table
-- Creates the dedicated past_questions table for exam board past questions (WAEC, JAMB, NECO, etc.)

CREATE TABLE IF NOT EXISTS past_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board VARCHAR(50) NOT NULL,
  year INTEGER,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  question_type VARCHAR(50) NOT NULL DEFAULT 'mcq',
  question_text TEXT NOT NULL,
  question_image_url TEXT,
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer JSONB,
  explanation TEXT,
  difficulty VARCHAR(20) DEFAULT 'medium',
  marks INTEGER DEFAULT 1,
  source VARCHAR(255),
  tags JSONB DEFAULT '[]'::jsonb,
  created_by UUID,
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_past_questions_board ON past_questions(board);
CREATE INDEX IF NOT EXISTS idx_past_questions_year ON past_questions(year);
CREATE INDEX IF NOT EXISTS idx_past_questions_subject ON past_questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_past_questions_topic ON past_questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_past_questions_board_year ON past_questions(board, year);
CREATE INDEX IF NOT EXISTS idx_past_questions_board_subject ON past_questions(board, subject_id);
