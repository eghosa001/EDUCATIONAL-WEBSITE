CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    certificate_id VARCHAR(50) UNIQUE NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
    student_name VARCHAR(200) NOT NULL,
    course_title VARCHAR(300) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id ON certificates(certificate_id);
