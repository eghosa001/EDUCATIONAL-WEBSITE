-- Migration: add-documents-table
-- Tracks files stored in Supabase Storage buckets (WAEC past questions, NERDC schemes, etc.)

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  file_name VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT DEFAULT 0,
  mime_type VARCHAR(100) DEFAULT 'application/pdf',
  bucket VARCHAR(100) NOT NULL,
  storage_path TEXT,
  category VARCHAR(100) DEFAULT 'past_question',
  exam_board VARCHAR(50),
  exam_year INTEGER,
  subject VARCHAR(200),
  education_level VARCHAR(50),
  tags JSONB DEFAULT '[]'::jsonb,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_bucket ON documents(bucket);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_exam_board ON documents(exam_board);
CREATE INDEX IF NOT EXISTS idx_documents_exam_year ON documents(exam_year);
CREATE INDEX IF NOT EXISTS idx_documents_subject ON documents(subject);
CREATE INDEX IF NOT EXISTS idx_documents_education_level ON documents(education_level);
CREATE INDEX IF NOT EXISTS idx_documents_is_free ON documents(is_free);
