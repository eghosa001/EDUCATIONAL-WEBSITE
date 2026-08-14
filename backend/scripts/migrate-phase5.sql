-- Phase 5: Ecosystem modules - Community, Study Groups, Teacher Ops, Gamification Extras, Quiz Attempts, Live Classes

-- ============================================
-- COMMUNITY FORUMS
-- ============================================

CREATE TABLE IF NOT EXISTS forums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT TRUE,
    member_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forums_subject ON forums(subject_id);
CREATE INDEX IF NOT EXISTS idx_forums_public ON forums(is_public);

CREATE TABLE IF NOT EXISTS forum_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    forum_id UUID REFERENCES forums(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(forum_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_members_forum ON forum_members(forum_id);
CREATE INDEX IF NOT EXISTS idx_forum_members_user ON forum_members(user_id);

CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);

CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);

-- Link community posts to forums
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS forum_id UUID REFERENCES forums(id) ON DELETE SET NULL;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_community_posts_forum ON community_posts(forum_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts(user_id);

-- ============================================
-- STUDY GROUPS
-- ============================================

CREATE TABLE IF NOT EXISTS study_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    member_count INTEGER DEFAULT 1,
    max_members INTEGER DEFAULT 100,
    is_private BOOLEAN DEFAULT FALSE,
    join_code VARCHAR(20) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_groups_subject ON study_groups(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_groups_creator ON study_groups(creator_id);

CREATE TABLE IF NOT EXISTS study_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON study_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user ON study_group_members(user_id);

CREATE TABLE IF NOT EXISTS study_group_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_group_messages_group ON study_group_messages(group_id, created_at);

-- ============================================
-- QUIZ ATTEMPTS
-- ============================================

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) DEFAULT 'in_progress',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER,
    score DECIMAL(8,2),
    percentage DECIMAL(5,2),
    is_passed BOOLEAN,
    answers JSONB DEFAULT '{}'::jsonb,
    UNIQUE(quiz_id, student_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id);

-- ============================================
-- LIVE CLASSES
-- ============================================

CREATE TABLE IF NOT EXISTS live_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    status VARCHAR(20) DEFAULT 'scheduled',
    meeting_url VARCHAR(500),
    recording_url VARCHAR(500),
    student_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_classes_teacher ON live_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_course ON live_classes(course_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_scheduled ON live_classes(scheduled_at);

-- ============================================
-- TEACHER EARNINGS
-- ============================================

CREATE TABLE IF NOT EXISTS teacher_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    source VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_earnings_teacher ON teacher_earnings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_earnings_status ON teacher_earnings(status);

-- ============================================
-- GAMIFICATION REWARDS & POINTS HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    points_cost INTEGER NOT NULL DEFAULT 0,
    quantity_available INTEGER DEFAULT -1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_rewards_user ON user_rewards(user_id);

CREATE TABLE IF NOT EXISTS points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    action VARCHAR(100) NOT NULL,
    points INTEGER NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_history_user ON points_history(user_id, created_at);

-- ============================================
-- SYSTEM SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB DEFAULT '{}'::jsonb,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SEED BADGES
-- ============================================

INSERT INTO badges (name, code, description, criteria, xp_reward) VALUES
('First Steps', 'first_login', 'Complete your first login', '{"action": "first_login"}'::jsonb, 10),
('Lesson Learner', 'lesson_completion', 'Complete 10 lessons', '{"action": "lesson_completion", "count": 10}'::jsonb, 50),
('Quiz Whiz', 'quiz_master', 'Score 80% or above in 5 quizzes', '{"action": "quiz_master", "count": 5}'::jsonb, 100),
('Exam Warrior', 'exam_warrior', 'Complete 10 examinations', '{"action": "exam_warrior", "count": 10}'::jsonb, 150),
('Streak Starter', 'streak_7', 'Maintain a 7-day study streak', '{"action": "streak_7"}'::jsonb, 70),
('Perfect Score', 'perfect_score', 'Score 100% in any examination', '{"action": "perfect_score"}'::jsonb, 200),
('Course Champion', 'course_completion', 'Complete your first course', '{"action": "course_completion"}'::jsonb, 250),
('Question Crusher', 'questions_100', 'Answer 100 questions', '{"action": "questions_100", "count": 100}'::jsonb, 120),
('Profile Perfection', 'profile_complete', 'Complete your profile', '{"action": "profile_complete"}'::jsonb, 30),
('Community Voice', 'social_share', 'Share knowledge in the community', '{"action": "social_share"}'::jsonb, 40)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- SEED REWARDS
-- ============================================

INSERT INTO rewards (name, description, points_cost, quantity_available) VALUES
('1 Month Student Premium', 'Redeem for a free month of Student Premium subscription', 10000, 50),
('JAMB Past Questions Pack', 'Downloadable JAMB past questions compilation', 5000, 200),
('Study Planner PDF', 'Printable 90-day study planner', 1500, -1),
('Exclusive Webinar Pass', 'Access to exclusive examination preparation webinars', 3000, 100)
ON CONFLICT (id) DO NOTHING;
