-- Create missing bookmarks table (referenced in RLS migration but never created)
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_course ON bookmarks(course_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_lesson ON bookmarks(lesson_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_unique ON bookmarks(user_id, course_id, lesson_id);

-- Enable RLS on bookmarks
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
  FOR SELECT USING (user_id = nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid, user_id);

CREATE POLICY "Users can insert own bookmarks" ON public.bookmarks
  FOR INSERT WITH CHECK (user_id = nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid, user_id);

CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks
  FOR DELETE USING (user_id = nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid, user_id);
