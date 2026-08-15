-- ============================================
-- LIVE CLASS ATTENDANCE MODULE
-- ============================================

CREATE TABLE IF NOT EXISTS live_class_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'joined' CHECK (status IN ('joined', 'left', 'attended', 'absent')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    attended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_live_class_attendance_class ON live_class_attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_live_class_attendance_user ON live_class_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_live_class_attendance_status ON live_class_attendance(status);
