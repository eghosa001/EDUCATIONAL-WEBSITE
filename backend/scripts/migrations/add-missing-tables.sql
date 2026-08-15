CREATE TABLE IF NOT EXISTS flashcard_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    repetition_level INTEGER DEFAULT 0,
    ease_factor DECIMAL(3,2) DEFAULT 2.5,
    review_count INTEGER DEFAULT 1,
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    next_review_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, flashcard_id)
);

CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user ON flashcard_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_flashcard ON flashcard_reviews(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_next_review ON flashcard_reviews(next_review_date) WHERE next_review_date <= NOW();

CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('video', 'quiz', 'reading', 'flashcard', 'exam', 'assignment')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    score DECIMAL(5,2),
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_subject ON study_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_time ON study_sessions(start_time);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    response TEXT NOT NULL,
    model VARCHAR(50) DEFAULT 'gpt-4o-mini',
    tokens_used INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage(created_at);

CREATE TABLE IF NOT EXISTS search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50) NOT NULL,
    content_id UUID NOT NULL,
    title TEXT,
    content TSVECTOR,
    keywords TEXT[],
    relevance_score DECIMAL(5,2) DEFAULT 0.5,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_index_type ON search_index(content_type);
CREATE INDEX IF NOT EXISTS idx_search_index_content ON search_index USING GIN(content);
CREATE INDEX IF NOT EXISTS idx_search_index_keywords ON search_index USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_search_index_relevance ON search_index(relevance_score DESC);

CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('push', 'email', 'sms', 'in_app')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    data JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retrying')),
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON notification_queue(user_id, status);
