-- Demo seeding script for development/testing
-- Run: psql -d <database> -f backend/scripts/seed-demo-data.sql

BEGIN;

-- ============================================================================
-- DEMO USERS (password: "Password1")
-- ============================================================================
INSERT INTO users (email, first_name, last_name, password_hash, is_verified, is_active, role, created_at)
VALUES
  ('admin@example.com', 'Super', 'Admin', '$2a$10$rOZxNdHuOe/Q/9XhzEe6Puw49Y4IbzLZkXXKVj2g5K8z5q3HqL6eO', true, true, 'super_admin', NOW() - INTERVAL '30 days'),
  ('teacher1@example.com', 'Amina', 'Bello', '$2a$10$rOZxNdHuOe/Q/9XhzEe6Puw49Y4IbzLZkXXKVj2g5K8z5q3HqL6eO', true, true, 'teacher', NOW() - INTERVAL '25 days'),
  ('teacher2@example.com', 'Chidi', 'Okafor', '$2a$10$rOZxNdHuOe/Q/9XhzEe6Puw49Y4IbzLZkXXKVj2g5K8z5q3HqL6eO', true, true, 'teacher', NOW() - INTERVAL '20 days'),
  ('student1@example.com', 'Emeka', 'Nwosu', '$2a$10$rOZxNdHuOe/Q/9XhzEe6Puw49Y4IbzLZkXXKVj2g5K8z5q3HqL6eO', true, true, 'student', NOW() - INTERVAL '15 days'),
  ('student2@example.com', 'Fatima', 'Abubakar', '$2a$10$rOZxNdHuOe/Q/9XhzEe6Puw49Y4IbzLZkXXKVj2g5K8z5q3HqL6eO', true, true, 'student', NOW() - INTERVAL '10 days'),
  ('parent1@example.com', 'Mrs.', 'Okonkwo', '$2a$10$rOZxNdHuOe/Q/9XhzEe6Puw49Y4IbzLZkXXKVj2g5K8z5q3HqL6eO', true, true, 'parent', NOW() - INTERVAL '12 days'),
  ('contentadmin@example.com', 'Data', 'Custodian', '$2a$10$rOZxNdHuOe/Q/9XhzEe6Puw49Y4IbzLZkXXKVj2g5K8z5q3HqL6eO', true, true, 'content_admin', NOW() - INTERVAL '18 days')
ON CONFLICT DO NOTHING;

-- Get user IDs for role assignment
WITH admin_id AS (SELECT id FROM users WHERE email = 'admin@example.com'),
     teacher1_id AS (SELECT id FROM users WHERE email = 'teacher1@example.com'),
     teacher2_id AS (SELECT id FROM users WHERE email = 'teacher2@example.com'),
     student1_id AS (SELECT id FROM users WHERE email = 'student1@example.com'),
     student2_id AS (SELECT id FROM users WHERE email = 'student2@example.com'),
     parent_id AS (SELECT id FROM users WHERE email = 'parent1@example.com'),
     content_id AS (SELECT id FROM users WHERE email = 'contentadmin@example.com')

-- Assign roles
INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT admin_id.id, r.id, NOW() FROM admin_id CROSS JOIN roles r WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT teacher1_id.id, r.id, NOW() FROM teacher1_id CROSS JOIN roles r WHERE r.name = 'teacher'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT teacher2_id.id, r.id, NOW() FROM teacher2_id CROSS JOIN roles r WHERE r.name = 'teacher'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT student1_id.id, r.id, NOW() FROM student1_id CROSS JOIN roles r WHERE r.name = 'student'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT student2_id.id, r.id, NOW() FROM student2_id CROSS JOIN roles r WHERE r.name = 'student'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT parent_id.id, r.id, NOW() FROM parent_id CROSS JOIN roles r WHERE r.name = 'parent'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT content_id.id, r.id, NOW() FROM content_id CROSS JOIN roles r WHERE r.name = 'content_admin'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- EDUCATION LEVELS & CLASSES
-- ============================================================================
INSERT INTO education_levels (name, slug, description, system)
VALUES
  ('Primary', 'primary', 'Primary education (ages 6-11)', 'nigerian'),
  ('Junior Secondary', 'junior_secondary', 'Junior secondary education (ages 12-14)', 'nigerian'),
  ('Senior Secondary', 'senior_secondary', 'Senior secondary education (ages 15-17)', 'nigerian')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO classes (name, slug, level_id, description)
SELECT 'Primary 1', 'primary-1', id, 'First year of primary school' FROM education_levels WHERE slug = 'primary'
UNION ALL
SELECT 'JSS 1', 'jss-1', id, 'First year of junior secondary' FROM education_levels WHERE slug = 'junior_secondary'
UNION ALL
SELECT 'SS 2', 'ss-2', id, 'Second year of senior secondary' FROM education_levels WHERE slug = 'senior_secondary'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUBJECTS
-- ============================================================================
INSERT INTO subjects (name, code, description)
VALUES
  ('Mathematics', 'MATH', 'Core mathematics subject'),
  ('English Language', 'ENG', 'English language and literature'),
  ('Biology', 'BIO', 'Study of living organisms'),
  ('Physics', 'PHY', 'Study of matter and energy'),
  ('Chemistry', 'CHEM', 'Study of substances and reactions'),
  ('Literature in English', 'LIT', 'English literature studies'),
  ('Further Mathematics', 'FMATH', 'Advanced mathematics'),
  ('Economics', 'ECO', 'Study of economy and trade'),
  ('Government', 'GOV', 'Study of politics and governance'),
  ('Geography', 'GEO', 'Study of earth and environments')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DEMO COURSES
-- ============================================================================
INSERT INTO courses (title, slug, short_description, full_description, subject_id, class_id, teacher_id, difficulty, status, price, is_free, is_featured, enrollment_count, rating, review_count, created_at, updated_at)
SELECT
  'Complete Mathematics for SS2',
  'complete-mathematics-ss2',
  'Master SS2 Mathematics with video lessons and practice',
  'Comprehensive SS2 Mathematics course covering algebra, geometry, trigonometry and statistics',
  s.id, c.id, t1.id, 'medium', 'published', 5000, false, true, 142, 4.7, 38, NOW() - INTERVAL '20 days', NOW()
FROM subjects s, classes c, users t1
WHERE s.code = 'MATH' AND c.slug = 'ss-2' AND t1.email = 'teacher1@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO courses (title, slug, short_description, full_description, subject_id, class_id, teacher_id, difficulty, status, price, is_free, is_featured, enrollment_count, rating, review_count, created_at, updated_at)
SELECT
  'Biology Fundamentals',
  'biology-fundamentals',
  'Essential biology concepts for senior secondary students',
  'Learn cell biology, genetics, ecology and human physiology with interactive lessons',
  s.id, c.id, t2.id, 'easy', 'published', 0, true, true, 356, 4.5, 72, NOW() - INTERVAL '15 days', NOW()
FROM subjects s, classes c, users t2
WHERE s.code = 'BIO' AND c.slug = 'ss-2' AND t2.email = 'teacher2@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO courses (title, slug, short_description, full_description, subject_id, class_id, teacher_id, difficulty, status, price, is_free, is_featured, enrollment_count, rating, review_count, created_at, updated_at)
SELECT
  'English Language Mastery',
  'english-language-mastery',
  'Improve your English grammar, comprehension and writing',
  'Full English language course for WASSCE and JAMB preparation',
  s.id, c.id, t1.id, 'medium', 'published', 3000, false, false, 89, 4.3, 21, NOW() - INTERVAL '10 days', NOW()
FROM subjects s, classes c, users t1
WHERE s.code = 'ENG' AND c.slug = 'jss-1' AND t1.email = 'teacher1@example.com'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DEMO QUESTIONS
-- ============================================================================
INSERT INTO questions (subject_id, topic_id, question_type, question_text, options, correct_answer, explanation, difficulty, marks, source, exam_year, exam_name, created_by, created_at)
SELECT
  s.id, NULL, 'mcq',
  'What is the value of x in the equation 2x + 5 = 15?',
  '[{"id":"A","text":"5"},{"id":"B","text":"10"},{"id":"C","text":"3"},{"id":"D","text":"7"}]'::jsonb,
  'A',
  'Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5',
  'easy', 1, 'WASSCE 2023', 2023, 'waec', (SELECT id FROM users WHERE email = \'teacher1@example.com\'), NOW()
FROM subjects s WHERE s.code = 'MATH'
ON CONFLICT DO NOTHING;

INSERT INTO questions (subject_id, topic_id, question_type, question_text, options, correct_answer, explanation, difficulty, marks, source, exam_year, exam_name, created_by, created_at)
SELECT
  s.id, NULL, 'mcq',
  'Which organelle is known as the powerhouse of the cell?',
  '[{"id":"A","text":"Nucleus"},{"id":"B","text":"Mitochondria"},{"id":"C","text":"Ribosome"},{"id":"D","text":"Golgi body"}]'::jsonb,
  'B',
  'Mitochondria generate most of the cellular ATP energy',
  'easy', 1, 'JAMB 2023', 2023, 'jamb', (SELECT id FROM users WHERE email = \'teacher2@example.com\'), NOW()
FROM subjects s WHERE s.code = 'BIO'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DEMO EXAMS
-- ============================================================================
INSERT INTO exams (title, description, exam_type, subject_id, class_id, duration_minutes, total_marks, passing_marks, instructions, is_published, max_attempts, created_by, created_at)
SELECT
  'Mid-Term Mathematics Test',
  'Covering algebra and geometry topics',
  'practice', s.id, c.id, 45, 100, 50, 'Answer all questions. Show your working.', true, 3,
  (SELECT id FROM users WHERE email = 'teacher1@example.com'), NOW()
FROM subjects s, classes c
WHERE s.code = 'MATH' AND c.slug = 'ss-2'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DEMO FLASHCARDS
-- ============================================================================
INSERT INTO flashcards (front, back, subject_id, topic_id, difficulty, created_by, created_at)
SELECT
  'What is Mitosis?',
  'Cell division that results in two daughter cells each having the same number and kind of chromosomes as the parent nucleus.',
  s.id, NULL, 'medium', (SELECT id FROM users WHERE email = 'teacher2@example.com'), NOW()
FROM subjects s WHERE s.code = 'BIO'
ON CONFLICT DO NOTHING;

INSERT INTO flashcards (front, back, subject_id, topic_id, difficulty, created_by, created_at)
SELECT
  'Define Osmosis',
  'The movement of water molecules from a region of higher concentration to a region of lower concentration through a semi-permeable membrane.',
  s.id, NULL, 'easy', (SELECT id FROM users WHERE email = 'teacher2@example.com'), NOW()
FROM subjects s WHERE s.code = 'BIO'
ON CONFLICT DO NOTHING;

COMMIT;
