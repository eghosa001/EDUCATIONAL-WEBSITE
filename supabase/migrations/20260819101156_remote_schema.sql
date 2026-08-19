


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "badge_id" "uuid",
    "earned_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_conversations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "course_id" "uuid",
    "lesson_id" "uuid",
    "topic_id" "uuid",
    "title" character varying(300) NOT NULL,
    "context" "jsonb" DEFAULT '{}'::"jsonb",
    "message_count" integer DEFAULT 0,
    "last_message_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid",
    "role" character varying(20) NOT NULL,
    "content" "text" NOT NULL,
    "tokens_used" integer DEFAULT 0,
    "model" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_usage" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "date" "date" NOT NULL,
    "questions_asked" integer DEFAULT 0,
    "tokens_used" integer DEFAULT 0,
    "conversations_started" integer DEFAULT 0
);


ALTER TABLE "public"."ai_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assignments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "course_id" "uuid",
    "lesson_id" "uuid",
    "teacher_id" "uuid",
    "title" character varying(300) NOT NULL,
    "description" "text",
    "instructions" "text",
    "assignment_type" character varying(50) DEFAULT 'homework'::character varying,
    "max_score" numeric(8,2) DEFAULT 100,
    "due_date" timestamp with time zone,
    "allow_late_submission" boolean DEFAULT false,
    "late_penalty_percent" numeric(5,2) DEFAULT 10,
    "max_file_size_mb" integer DEFAULT 10,
    "allowed_file_types" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "action" character varying(100) NOT NULL,
    "resource_type" character varying(100),
    "resource_id" "uuid",
    "changes" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "code" character varying(50) NOT NULL,
    "description" "text",
    "icon_url" character varying(500),
    "criteria" "jsonb" DEFAULT '{}'::"jsonb",
    "xp_reward" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."class_subjects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "class_id" "uuid",
    "subject_id" "uuid",
    "teacher_id" "uuid",
    "term_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."class_subjects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."classes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "program_id" "uuid",
    "name" character varying(100) NOT NULL,
    "code" character varying(20) NOT NULL,
    "description" "text",
    "order_index" integer NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_likes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comment_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "post_id" "uuid",
    "user_id" "uuid",
    "parent_id" "uuid",
    "content" "text" NOT NULL,
    "likes_count" integer DEFAULT 0,
    "status" character varying(20) DEFAULT 'published'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_posts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "type" character varying(50) DEFAULT 'discussion'::character varying,
    "title" character varying(300) NOT NULL,
    "content" "text" NOT NULL,
    "subject_id" "uuid",
    "topic_id" "uuid",
    "course_id" "uuid",
    "is_pinned" boolean DEFAULT false,
    "is_locked" boolean DEFAULT false,
    "views" integer DEFAULT 0,
    "likes_count" integer DEFAULT 0,
    "replies_count" integer DEFAULT 0,
    "last_reply_at" timestamp with time zone,
    "status" character varying(20) DEFAULT 'published'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "forum_id" "uuid",
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "like_count" integer DEFAULT 0
);


ALTER TABLE "public"."community_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupon_usages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "coupon_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "payment_id" "uuid",
    "discount_applied" numeric(12,2) NOT NULL,
    "used_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."coupon_usages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupons" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "discount_type" character varying(20) DEFAULT 'percentage'::character varying NOT NULL,
    "discount_value" numeric(12,2) NOT NULL,
    "max_discount_amount" numeric(12,2),
    "min_purchase_amount" numeric(12,2) DEFAULT 0,
    "usage_limit" integer DEFAULT '-1'::integer,
    "times_used" integer DEFAULT 0,
    "valid_from" timestamp with time zone NOT NULL,
    "valid_until" timestamp with time zone,
    "applicable_plans" "jsonb" DEFAULT '[]'::"jsonb",
    "is_single_use" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."coupons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_sections" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "course_id" "uuid",
    "title" character varying(300) NOT NULL,
    "description" "text",
    "order_index" integer NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."course_sections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "subject_id" "uuid",
    "class_id" "uuid",
    "term_id" "uuid",
    "teacher_id" "uuid",
    "title" character varying(300) NOT NULL,
    "slug" character varying(300) NOT NULL,
    "short_description" "text",
    "full_description" "text",
    "thumbnail_url" character varying(500),
    "preview_video_url" character varying(500),
    "difficulty" character varying(20) DEFAULT 'beginner'::character varying,
    "status" character varying(20) DEFAULT 'draft'::character varying,
    "price" numeric(12,2) DEFAULT 0,
    "currency" character varying(3) DEFAULT 'NGN'::character varying,
    "is_free" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "enrollment_count" integer DEFAULT 0,
    "rating" numeric(3,2) DEFAULT 0,
    "review_count" integer DEFAULT 0,
    "total_duration_hours" numeric(6,2) DEFAULT 0,
    "lesson_count" integer DEFAULT 0,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(500) NOT NULL,
    "description" "text",
    "file_name" character varying(500) NOT NULL,
    "file_url" "text" NOT NULL,
    "file_size_bytes" bigint DEFAULT 0,
    "mime_type" character varying(100) DEFAULT 'application/pdf'::character varying,
    "bucket" character varying(100) NOT NULL,
    "storage_path" "text",
    "category" character varying(100) DEFAULT 'past_question'::character varying,
    "exam_board" character varying(50),
    "exam_year" integer,
    "subject" character varying(200),
    "education_level" character varying(50),
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "download_count" integer DEFAULT 0,
    "view_count" integer DEFAULT 0,
    "is_free" boolean DEFAULT true,
    "is_active" boolean DEFAULT true,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."education_levels" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "education_system_id" "uuid",
    "name" character varying(100) NOT NULL,
    "code" character varying(20) NOT NULL,
    "description" "text",
    "order_index" integer NOT NULL,
    "min_age" integer,
    "max_age" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."education_levels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."education_systems" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "code" character varying(20) NOT NULL,
    "country" character varying(100) NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."education_systems" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exam_answers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "attempt_id" "uuid",
    "question_id" "uuid",
    "student_answer" "jsonb",
    "is_correct" boolean,
    "marks_obtained" numeric(5,2) DEFAULT 0,
    "time_spent_seconds" integer,
    "answered_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."exam_answers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exam_attempts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "exam_id" "uuid",
    "student_id" "uuid",
    "attempt_number" integer NOT NULL,
    "status" character varying(20) DEFAULT 'in_progress'::character varying,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "submitted_at" timestamp with time zone,
    "time_spent_seconds" integer,
    "score" numeric(8,2),
    "percentage" numeric(5,2),
    "is_passed" boolean,
    "rank" integer,
    "total_students" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."exam_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exam_questions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "exam_id" "uuid",
    "question_id" "uuid",
    "order_index" integer NOT NULL,
    "marks" numeric(5,2) DEFAULT 1,
    "section_name" character varying(100)
);


ALTER TABLE "public"."exam_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exams" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" character varying(300) NOT NULL,
    "slug" character varying(300) NOT NULL,
    "description" "text",
    "exam_type" character varying(50) NOT NULL,
    "subject_id" "uuid",
    "class_id" "uuid",
    "duration_minutes" integer NOT NULL,
    "total_marks" numeric(8,2) DEFAULT 0,
    "passing_marks" numeric(8,2) DEFAULT 0,
    "instructions" "text",
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "is_timed" boolean DEFAULT true,
    "shuffle_questions" boolean DEFAULT true,
    "show_results_immediately" boolean DEFAULT false,
    "allow_review" boolean DEFAULT true,
    "max_attempts" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "is_public" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."exams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flashcard_reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "flashcard_id" "uuid",
    "card_index" integer NOT NULL,
    "user_id" "uuid",
    "ease_factor" numeric(3,2) DEFAULT 2.5,
    "interval_days" integer DEFAULT 1,
    "next_review_at" timestamp with time zone NOT NULL,
    "reviews_count" integer DEFAULT 0,
    "last_answer_correct" boolean,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."flashcard_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flashcards" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "course_id" "uuid",
    "lesson_id" "uuid",
    "topic_id" "uuid",
    "subject_id" "uuid",
    "title" character varying(300) NOT NULL,
    "description" "text",
    "cards" "jsonb" NOT NULL,
    "mode" character varying(20) DEFAULT 'standard'::character varying,
    "is_public" boolean DEFAULT false,
    "created_by" "uuid",
    "view_count" integer DEFAULT 0,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."flashcards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forum_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "forum_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "role" character varying(20) DEFAULT 'member'::character varying,
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."forum_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."forums" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(200) NOT NULL,
    "slug" character varying(200) NOT NULL,
    "description" "text",
    "subject_id" "uuid",
    "class_id" "uuid",
    "is_public" boolean DEFAULT true,
    "member_count" integer DEFAULT 0,
    "post_count" integer DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."forums" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "invoice_number" character varying(50) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subscription_id" "uuid",
    "payment_id" "uuid",
    "amount" numeric(12,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'NGN'::character varying,
    "tax_amount" numeric(12,2) DEFAULT 0,
    "discount_amount" numeric(12,2) DEFAULT 0,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "due_date" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "issued_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leaderboards" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" character varying(50) NOT NULL,
    "period" character varying(20) NOT NULL,
    "user_id" "uuid",
    "rank" integer,
    "points" integer DEFAULT 0,
    "stats" "jsonb" DEFAULT '{}'::"jsonb",
    "period_start" timestamp with time zone,
    "period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leaderboards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lesson_progress" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "student_id" "uuid",
    "lesson_id" "uuid",
    "course_id" "uuid",
    "status" character varying(20) DEFAULT 'not_started'::character varying,
    "progress_percentage" numeric(5,2) DEFAULT 0,
    "watch_time_seconds" integer DEFAULT 0,
    "completed_at" timestamp with time zone,
    "last_position_seconds" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lesson_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lesson_resources" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "lesson_id" "uuid",
    "title" character varying(200) NOT NULL,
    "resource_type" character varying(50) NOT NULL,
    "file_url" character varying(500) NOT NULL,
    "file_size_bytes" bigint,
    "mime_type" character varying(100),
    "description" "text",
    "is_downloadable" boolean DEFAULT true,
    "order_index" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lesson_resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lessons" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "course_id" "uuid",
    "section_id" "uuid",
    "topic_id" "uuid",
    "subtopic_id" "uuid",
    "title" character varying(300) NOT NULL,
    "slug" character varying(300) NOT NULL,
    "description" "text",
    "learning_objectives" "jsonb" DEFAULT '[]'::"jsonb",
    "content_type" character varying(50) DEFAULT 'video'::character varying,
    "video_url" character varying(500),
    "video_duration_seconds" integer,
    "video_thumbnail_url" character varying(500),
    "written_content" "text",
    "key_points" "jsonb" DEFAULT '[]'::"jsonb",
    "order_index" integer NOT NULL,
    "is_free" boolean DEFAULT false,
    "is_published" boolean DEFAULT false,
    "estimated_minutes" integer DEFAULT 0,
    "view_count" integer DEFAULT 0,
    "completion_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lessons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."library_resources" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" character varying(300) NOT NULL,
    "slug" character varying(300) NOT NULL,
    "resource_type" character varying(50) NOT NULL,
    "file_url" character varying(500) NOT NULL,
    "thumbnail_url" character varying(500),
    "description" "text",
    "subject_id" "uuid",
    "topic_id" "uuid",
    "class_id" "uuid",
    "exam_board" character varying(100),
    "exam_year" integer,
    "author_id" "uuid",
    "download_count" integer DEFAULT 0,
    "view_count" integer DEFAULT 0,
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "is_free" boolean DEFAULT true,
    "file_size_bytes" bigint,
    "mime_type" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."library_resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."live_classes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "title" character varying(300) NOT NULL,
    "description" "text",
    "scheduled_at" timestamp with time zone NOT NULL,
    "duration_minutes" integer DEFAULT 60 NOT NULL,
    "status" character varying(20) DEFAULT 'scheduled'::character varying,
    "meeting_url" character varying(500),
    "recording_url" character varying(500),
    "student_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."live_classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "type" character varying(50) NOT NULL,
    "title" character varying(300) NOT NULL,
    "body" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "read_at" timestamp with time zone,
    "action_url" character varying(500),
    "channel" character varying(20) DEFAULT 'in_app'::character varying,
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parent_children" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parent_id" "uuid",
    "child_user_id" "uuid",
    "relationship" character varying(50),
    "preferred_contact_method" character varying(50) DEFAULT 'sms'::character varying,
    "notifications_enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."parent_children" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "occupation" character varying(200),
    "phone" character varying(20),
    "address" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."parents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."password_resets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "token_hash" character varying(255) NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."password_resets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."past_question_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_id" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" bigint,
    "mime_type" "text" DEFAULT 'application/pdf'::"text",
    "board" "text" NOT NULL,
    "subject" "text",
    "year" integer,
    "paper_type" "text",
    "file_url" "text",
    "public_url" "text",
    "is_processed" boolean DEFAULT false,
    "questions_extracted" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."past_question_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."past_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "board" character varying(50) NOT NULL,
    "year" integer,
    "subject_id" "uuid",
    "topic_id" "uuid",
    "question_type" character varying(50) DEFAULT 'mcq'::character varying NOT NULL,
    "question_text" "text" NOT NULL,
    "question_image_url" "text",
    "options" "jsonb" DEFAULT '[]'::"jsonb",
    "correct_answer" "jsonb",
    "explanation" "text",
    "difficulty" character varying(20) DEFAULT 'medium'::character varying,
    "marks" integer DEFAULT 1,
    "source" character varying(255),
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "created_by" "uuid",
    "is_active" boolean DEFAULT true,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."past_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "gateway" character varying(20) NOT NULL,
    "gateway_token" character varying(255) NOT NULL,
    "type" character varying(50) NOT NULL,
    "last_four" character varying(4),
    "expiry_month" integer,
    "expiry_year" integer,
    "is_default" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "reference" character varying(100) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'NGN'::character varying,
    "gateway" character varying(20) NOT NULL,
    "gateway_reference" character varying(255),
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "purpose" character varying(50) NOT NULL,
    "purpose_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "paid_at" timestamp with time zone,
    "failed_at" timestamp with time zone,
    "failure_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."points_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" character varying(100) NOT NULL,
    "points" integer NOT NULL,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."points_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_likes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "post_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."post_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."programs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "education_level_id" "uuid",
    "name" character varying(100) NOT NULL,
    "code" character varying(20) NOT NULL,
    "description" "text",
    "duration_years" numeric(3,1),
    "order_index" integer NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."programs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "subject_id" "uuid",
    "topic_id" "uuid",
    "subtopic_id" "uuid",
    "class_id" "uuid",
    "question_type" character varying(30) NOT NULL,
    "question_text" "text" NOT NULL,
    "question_image_url" character varying(500),
    "options" "jsonb" DEFAULT '[]'::"jsonb",
    "correct_answer" "jsonb" NOT NULL,
    "explanation" "text",
    "explanation_image_url" character varying(500),
    "difficulty" character varying(20) DEFAULT 'medium'::character varying,
    "marks" numeric(5,2) DEFAULT 1,
    "negative_marks" numeric(5,2) DEFAULT 0,
    "time_limit_seconds" integer,
    "source" character varying(100),
    "exam_year" integer,
    "exam_name" character varying(100),
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "usage_count" integer DEFAULT 0,
    "created_by" "uuid",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_attempts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "quiz_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "attempt_number" integer DEFAULT 1 NOT NULL,
    "status" character varying(20) DEFAULT 'in_progress'::character varying,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "submitted_at" timestamp with time zone,
    "time_spent_seconds" integer,
    "score" numeric(8,2),
    "percentage" numeric(5,2),
    "is_passed" boolean,
    "answers" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."quiz_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_questions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "quiz_id" "uuid",
    "question_id" "uuid",
    "order_index" integer NOT NULL,
    "marks" numeric(5,2) DEFAULT 1
);


ALTER TABLE "public"."quiz_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quizzes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "course_id" "uuid",
    "lesson_id" "uuid",
    "title" character varying(300) NOT NULL,
    "description" "text",
    "instructions" "text",
    "time_limit_minutes" integer,
    "passing_score" numeric(5,2) DEFAULT 50,
    "max_attempts" integer DEFAULT 3,
    "shuffle_questions" boolean DEFAULT true,
    "show_explanation" boolean DEFAULT true,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."quizzes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" character varying(50) NOT NULL,
    "title" character varying(300) NOT NULL,
    "description" "text",
    "filters" "jsonb" DEFAULT '{}'::"jsonb",
    "generated_by" "uuid",
    "file_url" character varying(500),
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rewards" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(200) NOT NULL,
    "description" "text",
    "image_url" character varying(500),
    "points_cost" integer DEFAULT 0 NOT NULL,
    "quantity_available" integer DEFAULT '-1'::integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rewards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "description" "text",
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."school_classes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "school_id" "uuid",
    "class_id" "uuid",
    "teacher_id" "uuid",
    "capacity" integer,
    "term_id" "uuid",
    "academic_year" integer,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."school_classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."school_students" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "school_id" "uuid",
    "student_id" "uuid",
    "class_id" "uuid",
    "enrollment_year" integer,
    "admission_number" character varying(100),
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."school_students" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."school_teachers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "school_id" "uuid",
    "teacher_id" "uuid",
    "employee_id" character varying(100),
    "department" character varying(100),
    "employment_date" "date",
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."school_teachers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schools" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(300) NOT NULL,
    "code" character varying(50) NOT NULL,
    "email" character varying(255),
    "phone" character varying(20),
    "address" "text",
    "state" character varying(100),
    "lga" character varying(100),
    "type" character varying(50),
    "logo_url" character varying(500),
    "established_year" integer,
    "max_students" integer,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "admin_id" "uuid",
    "subscription_id" "uuid",
    "subscription_status" character varying(20) DEFAULT 'free'::character varying,
    "features" "jsonb" DEFAULT '{}'::"jsonb",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."schools" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "token_hash" character varying(255) NOT NULL,
    "refresh_token_hash" character varying(255),
    "device_info" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_courses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "student_id" "uuid",
    "course_id" "uuid",
    "enrolled_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "progress_percentage" numeric(5,2) DEFAULT 0,
    "last_accessed_at" timestamp with time zone,
    "certificate_issued_at" timestamp with time zone,
    "certificate_url" character varying(500)
);


ALTER TABLE "public"."student_courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_points" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "total_points" integer DEFAULT 0,
    "current_streak" integer DEFAULT 0,
    "longest_streak" integer DEFAULT 0,
    "level" integer DEFAULT 1,
    "xp_to_next_level" integer DEFAULT 100,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."student_points" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_group_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "group_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "role" character varying(20) DEFAULT 'member'::character varying,
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."study_group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_group_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "group_id" "uuid",
    "author_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."study_group_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_groups" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(200) NOT NULL,
    "description" "text",
    "subject_id" "uuid",
    "topic_id" "uuid",
    "creator_id" "uuid",
    "member_count" integer DEFAULT 1,
    "max_members" integer DEFAULT 100,
    "is_private" boolean DEFAULT false,
    "join_code" character varying(20),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."study_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "student_id" "uuid",
    "course_id" "uuid",
    "lesson_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone,
    "duration_seconds" integer,
    "activity_type" character varying(50),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."study_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subjects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "education_system_id" "uuid",
    "name" character varying(100) NOT NULL,
    "code" character varying(20) NOT NULL,
    "description" "text",
    "icon" character varying(100),
    "color" character varying(7),
    "order_index" integer NOT NULL,
    "is_core" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subjects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."submissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "assignment_id" "uuid",
    "student_id" "uuid",
    "content" "text",
    "file_urls" "jsonb" DEFAULT '[]'::"jsonb",
    "status" character varying(20) DEFAULT 'submitted'::character varying,
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "graded_at" timestamp with time zone,
    "graded_by" "uuid",
    "score" numeric(8,2),
    "feedback" "text",
    "is_late" boolean DEFAULT false
);


ALTER TABLE "public"."submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "code" character varying(50) NOT NULL,
    "description" "text",
    "price" numeric(12,2) DEFAULT 0 NOT NULL,
    "currency" character varying(3) DEFAULT 'NGN'::character varying,
    "billing_cycle" character varying(20) DEFAULT 'monthly'::character varying,
    "duration_days" integer DEFAULT 30 NOT NULL,
    "trial_days" integer DEFAULT 0,
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "limits" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "is_popular" boolean DEFAULT false,
    "display_order" integer DEFAULT 0,
    "stripe_price_id" character varying(255),
    "paystack_plan_code" character varying(255),
    "flutterwave_plan_code" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_id" "uuid",
    "gateway_subscription_id" character varying(255),
    "gateway" character varying(20) DEFAULT 'wallet'::character varying,
    "status" character varying(20) DEFAULT 'trialing'::character varying,
    "current_period_start" timestamp with time zone NOT NULL,
    "current_period_end" timestamp with time zone NOT NULL,
    "cancel_at_period_end" boolean DEFAULT false,
    "canceled_at" timestamp with time zone,
    "cancellation_reason" "text",
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subtopics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "topic_id" "uuid",
    "name" character varying(200) NOT NULL,
    "code" character varying(50) NOT NULL,
    "description" "text",
    "learning_objectives" "jsonb" DEFAULT '[]'::"jsonb",
    "order_index" integer NOT NULL,
    "estimated_hours" numeric(5,2),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subtopics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "key" character varying(100) NOT NULL,
    "value" "jsonb" DEFAULT '{}'::"jsonb",
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teacher_earnings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "course_id" "uuid",
    "amount" numeric(12,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'NGN'::character varying,
    "source" character varying(50) NOT NULL,
    "description" "text",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."teacher_earnings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teachers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "qualification" character varying(300),
    "specialization" character varying(300),
    "bio" "text",
    "avatar_url" character varying(500),
    "rating" numeric(3,2) DEFAULT 0,
    "review_count" integer DEFAULT 0,
    "total_earnings" numeric(12,2) DEFAULT 0,
    "payout_account" character varying(255),
    "is_verified" boolean DEFAULT false,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."teachers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."terms" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "education_system_id" "uuid",
    "name" character varying(100) NOT NULL,
    "code" character varying(20) NOT NULL,
    "description" "text",
    "order_index" integer NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."terms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."topics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "subject_id" "uuid",
    "class_id" "uuid",
    "term_id" "uuid",
    "name" character varying(200) NOT NULL,
    "code" character varying(50) NOT NULL,
    "description" "text",
    "learning_objectives" "jsonb" DEFAULT '[]'::"jsonb",
    "order_index" integer NOT NULL,
    "estimated_hours" numeric(5,2),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."topics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "payment_id" "uuid",
    "wallet_id" "uuid",
    "user_id" "uuid",
    "type" character varying(50) NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'NGN'::character varying,
    "balance_before" numeric(12,2) NOT NULL,
    "balance_after" numeric(12,2) NOT NULL,
    "reference" character varying(100),
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_rewards" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "reward_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "redeemed_at" timestamp with time zone DEFAULT "now"(),
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_rewards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "assigned_by" "uuid"
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "phone" character varying(20),
    "password_hash" character varying(255) NOT NULL,
    "first_name" character varying(100) NOT NULL,
    "last_name" character varying(100) NOT NULL,
    "middle_name" character varying(100),
    "date_of_birth" "date",
    "gender" character varying(20),
    "avatar_url" character varying(500),
    "is_verified" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "last_login_at" timestamp with time zone,
    "email_verified_at" timestamp with time zone,
    "phone_verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallet_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "wallet_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "type" character varying(20) NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "balance_before" numeric(12,2) NOT NULL,
    "balance_after" numeric(12,2) NOT NULL,
    "reference" character varying(100),
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wallet_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "balance" numeric(12,2) DEFAULT 0,
    "currency" character varying(3) DEFAULT 'NGN'::character varying,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wallets" OWNER TO "postgres";


ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_user_id_badge_id_key" UNIQUE ("user_id", "badge_id");



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_usage"
    ADD CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_usage"
    ADD CONSTRAINT "ai_usage_user_id_date_key" UNIQUE ("user_id", "date");



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_subjects"
    ADD CONSTRAINT "class_subjects_class_id_subject_id_term_id_key" UNIQUE ("class_id", "subject_id", "term_id");



ALTER TABLE ONLY "public"."class_subjects"
    ADD CONSTRAINT "class_subjects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_program_id_code_key" UNIQUE ("program_id", "code");



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_comment_id_user_id_key" UNIQUE ("comment_id", "user_id");



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupon_usages"
    ADD CONSTRAINT "coupon_usages_coupon_id_user_id_key" UNIQUE ("coupon_id", "user_id");



ALTER TABLE ONLY "public"."coupon_usages"
    ADD CONSTRAINT "coupon_usages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_sections"
    ADD CONSTRAINT "course_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."education_levels"
    ADD CONSTRAINT "education_levels_education_system_id_code_key" UNIQUE ("education_system_id", "code");



ALTER TABLE ONLY "public"."education_levels"
    ADD CONSTRAINT "education_levels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."education_systems"
    ADD CONSTRAINT "education_systems_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."education_systems"
    ADD CONSTRAINT "education_systems_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exam_answers"
    ADD CONSTRAINT "exam_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exam_attempts"
    ADD CONSTRAINT "exam_attempts_exam_id_student_id_attempt_number_key" UNIQUE ("exam_id", "student_id", "attempt_number");



ALTER TABLE ONLY "public"."exam_attempts"
    ADD CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exam_questions"
    ADD CONSTRAINT "exam_questions_exam_id_question_id_key" UNIQUE ("exam_id", "question_id");



ALTER TABLE ONLY "public"."exam_questions"
    ADD CONSTRAINT "exam_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exams"
    ADD CONSTRAINT "exams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exams"
    ADD CONSTRAINT "exams_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."flashcard_reviews"
    ADD CONSTRAINT "flashcard_reviews_flashcard_id_card_index_user_id_key" UNIQUE ("flashcard_id", "card_index", "user_id");



ALTER TABLE ONLY "public"."flashcard_reviews"
    ADD CONSTRAINT "flashcard_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."flashcards"
    ADD CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forum_members"
    ADD CONSTRAINT "forum_members_forum_id_user_id_key" UNIQUE ("forum_id", "user_id");



ALTER TABLE ONLY "public"."forum_members"
    ADD CONSTRAINT "forum_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forums"
    ADD CONSTRAINT "forums_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."forums"
    ADD CONSTRAINT "forums_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leaderboards"
    ADD CONSTRAINT "leaderboards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leaderboards"
    ADD CONSTRAINT "leaderboards_type_period_user_id_key" UNIQUE ("type", "period", "user_id");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_student_id_lesson_id_key" UNIQUE ("student_id", "lesson_id");



ALTER TABLE ONLY "public"."lesson_resources"
    ADD CONSTRAINT "lesson_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_course_id_slug_key" UNIQUE ("course_id", "slug");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."library_resources"
    ADD CONSTRAINT "library_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."library_resources"
    ADD CONSTRAINT "library_resources_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."live_classes"
    ADD CONSTRAINT "live_classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parent_children"
    ADD CONSTRAINT "parent_children_parent_id_child_user_id_key" UNIQUE ("parent_id", "child_user_id");



ALTER TABLE ONLY "public"."parent_children"
    ADD CONSTRAINT "parent_children_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parents"
    ADD CONSTRAINT "parents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."password_resets"
    ADD CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."past_question_files"
    ADD CONSTRAINT "past_question_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."past_questions"
    ADD CONSTRAINT "past_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_user_id_gateway_gateway_token_key" UNIQUE ("user_id", "gateway", "gateway_token");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_reference_key" UNIQUE ("reference");



ALTER TABLE ONLY "public"."points_history"
    ADD CONSTRAINT "points_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_post_id_user_id_key" UNIQUE ("post_id", "user_id");



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_education_level_id_code_key" UNIQUE ("education_level_id", "code");



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_quiz_id_student_id_attempt_number_key" UNIQUE ("quiz_id", "student_id", "attempt_number");



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_quiz_id_question_id_key" UNIQUE ("quiz_id", "question_id");



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rewards"
    ADD CONSTRAINT "rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."school_classes"
    ADD CONSTRAINT "school_classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."school_classes"
    ADD CONSTRAINT "school_classes_school_id_class_id_term_id_key" UNIQUE ("school_id", "class_id", "term_id");



ALTER TABLE ONLY "public"."school_students"
    ADD CONSTRAINT "school_students_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."school_students"
    ADD CONSTRAINT "school_students_school_id_student_id_key" UNIQUE ("school_id", "student_id");



ALTER TABLE ONLY "public"."school_teachers"
    ADD CONSTRAINT "school_teachers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."school_teachers"
    ADD CONSTRAINT "school_teachers_school_id_teacher_id_key" UNIQUE ("school_id", "teacher_id");



ALTER TABLE ONLY "public"."schools"
    ADD CONSTRAINT "schools_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."schools"
    ADD CONSTRAINT "schools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_courses"
    ADD CONSTRAINT "student_courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_courses"
    ADD CONSTRAINT "student_courses_student_id_course_id_key" UNIQUE ("student_id", "course_id");



ALTER TABLE ONLY "public"."student_points"
    ADD CONSTRAINT "student_points_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_points"
    ADD CONSTRAINT "student_points_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."study_group_members"
    ADD CONSTRAINT "study_group_members_group_id_user_id_key" UNIQUE ("group_id", "user_id");



ALTER TABLE ONLY "public"."study_group_members"
    ADD CONSTRAINT "study_group_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_group_messages"
    ADD CONSTRAINT "study_group_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_groups"
    ADD CONSTRAINT "study_groups_join_code_key" UNIQUE ("join_code");



ALTER TABLE ONLY "public"."study_groups"
    ADD CONSTRAINT "study_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_sessions"
    ADD CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_education_system_id_code_key" UNIQUE ("education_system_id", "code");



ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_assignment_id_student_id_key" UNIQUE ("assignment_id", "student_id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subtopics"
    ADD CONSTRAINT "subtopics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subtopics"
    ADD CONSTRAINT "subtopics_topic_id_code_key" UNIQUE ("topic_id", "code");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_earnings"
    ADD CONSTRAINT "teacher_earnings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teachers"
    ADD CONSTRAINT "teachers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."terms"
    ADD CONSTRAINT "terms_education_system_id_code_key" UNIQUE ("education_system_id", "code");



ALTER TABLE ONLY "public"."terms"
    ADD CONSTRAINT "terms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topics_subject_id_class_id_term_id_code_key" UNIQUE ("subject_id", "class_id", "term_id", "code");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_rewards"
    ADD CONSTRAINT "user_rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_achievements_user_id" ON "public"."achievements" USING "btree" ("user_id");



CREATE INDEX "idx_ai_conversations_created" ON "public"."ai_conversations" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_ai_conversations_user" ON "public"."ai_conversations" USING "btree" ("user_id");



CREATE INDEX "idx_ai_messages_conversation" ON "public"."ai_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_ai_usage_user" ON "public"."ai_usage" USING "btree" ("user_id", "date" DESC);



CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action");



CREATE INDEX "idx_audit_logs_created" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_resource" ON "public"."audit_logs" USING "btree" ("resource_type", "resource_id");



CREATE INDEX "idx_audit_logs_user" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_comment_likes_comment" ON "public"."comment_likes" USING "btree" ("comment_id");



CREATE INDEX "idx_comments_post" ON "public"."comments" USING "btree" ("post_id");



CREATE INDEX "idx_comments_user" ON "public"."comments" USING "btree" ("user_id");



CREATE INDEX "idx_community_posts_course" ON "public"."community_posts" USING "btree" ("course_id");



CREATE INDEX "idx_community_posts_forum" ON "public"."community_posts" USING "btree" ("forum_id");



CREATE INDEX "idx_community_posts_status" ON "public"."community_posts" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_community_posts_subject" ON "public"."community_posts" USING "btree" ("subject_id");



CREATE INDEX "idx_community_posts_user" ON "public"."community_posts" USING "btree" ("user_id");



CREATE INDEX "idx_coupon_usages_coupon_id" ON "public"."coupon_usages" USING "btree" ("coupon_id");



CREATE INDEX "idx_coupon_usages_user_id" ON "public"."coupon_usages" USING "btree" ("user_id");



CREATE INDEX "idx_coupons_code" ON "public"."coupons" USING "btree" ("code");



CREATE INDEX "idx_coupons_is_active" ON "public"."coupons" USING "btree" ("is_active");



CREATE INDEX "idx_documents_bucket" ON "public"."documents" USING "btree" ("bucket");



CREATE INDEX "idx_documents_category" ON "public"."documents" USING "btree" ("category");



CREATE INDEX "idx_documents_education_level" ON "public"."documents" USING "btree" ("education_level");



CREATE INDEX "idx_documents_exam_board" ON "public"."documents" USING "btree" ("exam_board");



CREATE INDEX "idx_documents_exam_year" ON "public"."documents" USING "btree" ("exam_year");



CREATE INDEX "idx_documents_is_free" ON "public"."documents" USING "btree" ("is_free");



CREATE INDEX "idx_documents_subject" ON "public"."documents" USING "btree" ("subject");



CREATE INDEX "idx_exam_questions_exam" ON "public"."exam_questions" USING "btree" ("exam_id");



CREATE INDEX "idx_flashcard_reviews_next" ON "public"."flashcard_reviews" USING "btree" ("next_review_at");



CREATE INDEX "idx_flashcard_reviews_user" ON "public"."flashcard_reviews" USING "btree" ("user_id");



CREATE INDEX "idx_flashcards_course" ON "public"."flashcards" USING "btree" ("course_id");



CREATE INDEX "idx_flashcards_subject" ON "public"."flashcards" USING "btree" ("subject_id");



CREATE INDEX "idx_flashcards_topic" ON "public"."flashcards" USING "btree" ("topic_id");



CREATE INDEX "idx_forum_members_forum" ON "public"."forum_members" USING "btree" ("forum_id");



CREATE INDEX "idx_forum_members_user" ON "public"."forum_members" USING "btree" ("user_id");



CREATE INDEX "idx_forums_public" ON "public"."forums" USING "btree" ("is_public");



CREATE INDEX "idx_forums_subject" ON "public"."forums" USING "btree" ("subject_id");



CREATE INDEX "idx_invoices_invoice_number" ON "public"."invoices" USING "btree" ("invoice_number");



CREATE INDEX "idx_invoices_status" ON "public"."invoices" USING "btree" ("status");



CREATE INDEX "idx_invoices_user_id" ON "public"."invoices" USING "btree" ("user_id");



CREATE INDEX "idx_lesson_progress_student_lesson" ON "public"."lesson_progress" USING "btree" ("student_id", "lesson_id");



CREATE INDEX "idx_lessons_course_section" ON "public"."lessons" USING "btree" ("course_id", "section_id");



CREATE INDEX "idx_library_resources_class" ON "public"."library_resources" USING "btree" ("class_id");



CREATE INDEX "idx_library_resources_exam" ON "public"."library_resources" USING "btree" ("exam_board", "exam_year");



CREATE INDEX "idx_library_resources_subject" ON "public"."library_resources" USING "btree" ("subject_id");



CREATE INDEX "idx_library_resources_type" ON "public"."library_resources" USING "btree" ("resource_type");



CREATE INDEX "idx_live_classes_course" ON "public"."live_classes" USING "btree" ("course_id");



CREATE INDEX "idx_live_classes_scheduled" ON "public"."live_classes" USING "btree" ("scheduled_at");



CREATE INDEX "idx_live_classes_teacher" ON "public"."live_classes" USING "btree" ("teacher_id");



CREATE INDEX "idx_notifications_read" ON "public"."notifications" USING "btree" ("user_id", "read_at");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_parent_children_child" ON "public"."parent_children" USING "btree" ("child_user_id");



CREATE INDEX "idx_parent_children_parent" ON "public"."parent_children" USING "btree" ("parent_id");



CREATE INDEX "idx_parents_user_id" ON "public"."parents" USING "btree" ("user_id");



CREATE INDEX "idx_past_questions_board" ON "public"."past_questions" USING "btree" ("board");



CREATE INDEX "idx_past_questions_board_subject" ON "public"."past_questions" USING "btree" ("board", "subject_id");



CREATE INDEX "idx_past_questions_board_year" ON "public"."past_questions" USING "btree" ("board", "year");



CREATE INDEX "idx_past_questions_subject" ON "public"."past_questions" USING "btree" ("subject_id");



CREATE INDEX "idx_past_questions_topic" ON "public"."past_questions" USING "btree" ("topic_id");



CREATE INDEX "idx_past_questions_year" ON "public"."past_questions" USING "btree" ("year");



CREATE INDEX "idx_payment_methods_user_id" ON "public"."payment_methods" USING "btree" ("user_id");



CREATE INDEX "idx_payments_created_at" ON "public"."payments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_payments_reference" ON "public"."payments" USING "btree" ("reference");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "idx_payments_user_id" ON "public"."payments" USING "btree" ("user_id");



CREATE INDEX "idx_points_history_user" ON "public"."points_history" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_post_likes_post" ON "public"."post_likes" USING "btree" ("post_id");



CREATE INDEX "idx_pqf_board" ON "public"."past_question_files" USING "btree" ("board");



CREATE INDEX "idx_pqf_bucket" ON "public"."past_question_files" USING "btree" ("bucket_id");



CREATE INDEX "idx_pqf_processed" ON "public"."past_question_files" USING "btree" ("is_processed");



CREATE INDEX "idx_pqf_subject" ON "public"."past_question_files" USING "btree" ("subject");



CREATE INDEX "idx_pqf_year" ON "public"."past_question_files" USING "btree" ("year");



CREATE INDEX "idx_questions_subject_topic" ON "public"."questions" USING "btree" ("subject_id", "topic_id");



CREATE INDEX "idx_quiz_attempts_student" ON "public"."quiz_attempts" USING "btree" ("student_id");



CREATE INDEX "idx_quiz_questions_quiz" ON "public"."quiz_questions" USING "btree" ("quiz_id");



CREATE INDEX "idx_reports_status" ON "public"."reports" USING "btree" ("status");



CREATE INDEX "idx_reports_type" ON "public"."reports" USING "btree" ("type");



CREATE INDEX "idx_school_classes_school" ON "public"."school_classes" USING "btree" ("school_id");



CREATE INDEX "idx_school_students_school" ON "public"."school_students" USING "btree" ("school_id");



CREATE INDEX "idx_school_students_student" ON "public"."school_students" USING "btree" ("student_id");



CREATE INDEX "idx_school_teachers_school" ON "public"."school_teachers" USING "btree" ("school_id");



CREATE INDEX "idx_school_teachers_teacher" ON "public"."school_teachers" USING "btree" ("teacher_id");



CREATE INDEX "idx_schools_code" ON "public"."schools" USING "btree" ("code");



CREATE INDEX "idx_schools_status" ON "public"."schools" USING "btree" ("status");



CREATE INDEX "idx_sessions_token_hash" ON "public"."sessions" USING "btree" ("token_hash");



CREATE INDEX "idx_sessions_user_id" ON "public"."sessions" USING "btree" ("user_id");



CREATE INDEX "idx_student_courses_student" ON "public"."student_courses" USING "btree" ("student_id");



CREATE INDEX "idx_student_points_total" ON "public"."student_points" USING "btree" ("total_points" DESC);



CREATE INDEX "idx_study_group_members_group" ON "public"."study_group_members" USING "btree" ("group_id");



CREATE INDEX "idx_study_group_members_user" ON "public"."study_group_members" USING "btree" ("user_id");



CREATE INDEX "idx_study_group_messages_group" ON "public"."study_group_messages" USING "btree" ("group_id", "created_at");



CREATE INDEX "idx_study_groups_creator" ON "public"."study_groups" USING "btree" ("creator_id");



CREATE INDEX "idx_study_groups_subject" ON "public"."study_groups" USING "btree" ("subject_id");



CREATE INDEX "idx_study_sessions_student_date" ON "public"."study_sessions" USING "btree" ("student_id", "started_at");



CREATE INDEX "idx_submissions_assignment" ON "public"."submissions" USING "btree" ("assignment_id");



CREATE INDEX "idx_subscriptions_plan_id" ON "public"."subscriptions" USING "btree" ("plan_id");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_subscriptions_user_id" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_teacher_earnings_status" ON "public"."teacher_earnings" USING "btree" ("status");



CREATE INDEX "idx_teacher_earnings_teacher" ON "public"."teacher_earnings" USING "btree" ("teacher_id");



CREATE INDEX "idx_teachers_user_id" ON "public"."teachers" USING "btree" ("user_id");



CREATE INDEX "idx_topics_subject_class_term" ON "public"."topics" USING "btree" ("subject_id", "class_id", "term_id");



CREATE INDEX "idx_transactions_created_at" ON "public"."transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_transactions_payment_id" ON "public"."transactions" USING "btree" ("payment_id");



CREATE INDEX "idx_transactions_user_id" ON "public"."transactions" USING "btree" ("user_id");



CREATE INDEX "idx_user_rewards_user" ON "public"."user_rewards" USING "btree" ("user_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_phone" ON "public"."users" USING "btree" ("phone");



CREATE INDEX "idx_wallet_transactions_created_at" ON "public"."wallet_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_wallet_transactions_user_id" ON "public"."wallet_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_wallet_transactions_wallet_id" ON "public"."wallet_transactions" USING "btree" ("wallet_id");



CREATE INDEX "idx_wallets_user_id" ON "public"."wallets" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_usage"
    ADD CONSTRAINT "ai_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assignments"
    ADD CONSTRAINT "assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."class_subjects"
    ADD CONSTRAINT "class_subjects_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_subjects"
    ADD CONSTRAINT "class_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_subjects"
    ADD CONSTRAINT "class_subjects_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."class_subjects"
    ADD CONSTRAINT "class_subjects_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."community_posts"
    ADD CONSTRAINT "community_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coupon_usages"
    ADD CONSTRAINT "coupon_usages_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coupon_usages"
    ADD CONSTRAINT "coupon_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."course_sections"
    ADD CONSTRAINT "course_sections_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."education_levels"
    ADD CONSTRAINT "education_levels_education_system_id_fkey" FOREIGN KEY ("education_system_id") REFERENCES "public"."education_systems"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exam_answers"
    ADD CONSTRAINT "exam_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exam_answers"
    ADD CONSTRAINT "exam_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exam_attempts"
    ADD CONSTRAINT "exam_attempts_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exam_attempts"
    ADD CONSTRAINT "exam_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exam_questions"
    ADD CONSTRAINT "exam_questions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exam_questions"
    ADD CONSTRAINT "exam_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."exams"
    ADD CONSTRAINT "exams_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."exams"
    ADD CONSTRAINT "exams_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."exams"
    ADD CONSTRAINT "exams_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."flashcard_reviews"
    ADD CONSTRAINT "flashcard_reviews_flashcard_id_fkey" FOREIGN KEY ("flashcard_id") REFERENCES "public"."flashcards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."flashcard_reviews"
    ADD CONSTRAINT "flashcard_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."flashcards"
    ADD CONSTRAINT "flashcards_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."flashcards"
    ADD CONSTRAINT "flashcards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."flashcards"
    ADD CONSTRAINT "flashcards_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."flashcards"
    ADD CONSTRAINT "flashcards_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."flashcards"
    ADD CONSTRAINT "flashcards_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."forum_members"
    ADD CONSTRAINT "forum_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."forums"
    ADD CONSTRAINT "forums_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."forums"
    ADD CONSTRAINT "forums_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."forums"
    ADD CONSTRAINT "forums_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leaderboards"
    ADD CONSTRAINT "leaderboards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_progress"
    ADD CONSTRAINT "lesson_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_resources"
    ADD CONSTRAINT "lesson_resources_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_subtopic_id_fkey" FOREIGN KEY ("subtopic_id") REFERENCES "public"."subtopics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."library_resources"
    ADD CONSTRAINT "library_resources_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."library_resources"
    ADD CONSTRAINT "library_resources_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."library_resources"
    ADD CONSTRAINT "library_resources_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."library_resources"
    ADD CONSTRAINT "library_resources_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."live_classes"
    ADD CONSTRAINT "live_classes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."live_classes"
    ADD CONSTRAINT "live_classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parent_children"
    ADD CONSTRAINT "parent_children_child_user_id_fkey" FOREIGN KEY ("child_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parent_children"
    ADD CONSTRAINT "parent_children_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parents"
    ADD CONSTRAINT "parents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."password_resets"
    ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."past_questions"
    ADD CONSTRAINT "past_questions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."past_questions"
    ADD CONSTRAINT "past_questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."points_history"
    ADD CONSTRAINT "points_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."programs"
    ADD CONSTRAINT "programs_education_level_id_fkey" FOREIGN KEY ("education_level_id") REFERENCES "public"."education_levels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_subtopic_id_fkey" FOREIGN KEY ("subtopic_id") REFERENCES "public"."subtopics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."school_classes"
    ADD CONSTRAINT "school_classes_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id");



ALTER TABLE ONLY "public"."school_classes"
    ADD CONSTRAINT "school_classes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."school_classes"
    ADD CONSTRAINT "school_classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."school_classes"
    ADD CONSTRAINT "school_classes_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id");



ALTER TABLE ONLY "public"."school_students"
    ADD CONSTRAINT "school_students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id");



ALTER TABLE ONLY "public"."school_students"
    ADD CONSTRAINT "school_students_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."school_students"
    ADD CONSTRAINT "school_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."school_teachers"
    ADD CONSTRAINT "school_teachers_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."school_teachers"
    ADD CONSTRAINT "school_teachers_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schools"
    ADD CONSTRAINT "schools_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_courses"
    ADD CONSTRAINT "student_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_courses"
    ADD CONSTRAINT "student_courses_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_points"
    ADD CONSTRAINT "student_points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_group_members"
    ADD CONSTRAINT "study_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_group_messages"
    ADD CONSTRAINT "study_group_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_groups"
    ADD CONSTRAINT "study_groups_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."study_groups"
    ADD CONSTRAINT "study_groups_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."study_groups"
    ADD CONSTRAINT "study_groups_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."study_sessions"
    ADD CONSTRAINT "study_sessions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."study_sessions"
    ADD CONSTRAINT "study_sessions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."study_sessions"
    ADD CONSTRAINT "study_sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subjects"
    ADD CONSTRAINT "subjects_education_system_id_fkey" FOREIGN KEY ("education_system_id") REFERENCES "public"."education_systems"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."submissions"
    ADD CONSTRAINT "submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subtopics"
    ADD CONSTRAINT "subtopics_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."teacher_earnings"
    ADD CONSTRAINT "teacher_earnings_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."teacher_earnings"
    ADD CONSTRAINT "teacher_earnings_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teachers"
    ADD CONSTRAINT "teachers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."terms"
    ADD CONSTRAINT "terms_education_system_id_fkey" FOREIGN KEY ("education_system_id") REFERENCES "public"."education_systems"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topics_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topics_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topics_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_rewards"
    ADD CONSTRAINT "user_rewards_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_rewards"
    ADD CONSTRAINT "user_rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin manage file metadata" ON "public"."past_question_files" TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['super_admin'::"text", 'content_admin'::"text", 'teacher'::"text"])));



CREATE POLICY "Public read file metadata" ON "public"."past_question_files" FOR SELECT USING (true);



ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."class_subjects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupon_usages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."education_levels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."education_systems" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exam_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exam_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exam_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."flashcard_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."flashcards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."forum_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."forums" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leaderboards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lesson_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lesson_resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."library_resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."live_classes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parent_children" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."password_resets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."past_question_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."points_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."programs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quizzes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rewards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."school_classes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."school_students" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."school_teachers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schools" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."student_points" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_group_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_group_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subtopics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teacher_earnings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teachers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."terms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."topics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_rewards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallet_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





































































































































































GRANT ALL ON TABLE "public"."achievements" TO "anon";
GRANT ALL ON TABLE "public"."achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."achievements" TO "service_role";



GRANT ALL ON TABLE "public"."ai_conversations" TO "anon";
GRANT ALL ON TABLE "public"."ai_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_messages" TO "anon";
GRANT ALL ON TABLE "public"."ai_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_messages" TO "service_role";



GRANT ALL ON TABLE "public"."ai_usage" TO "anon";
GRANT ALL ON TABLE "public"."ai_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_usage" TO "service_role";



GRANT ALL ON TABLE "public"."assignments" TO "anon";
GRANT ALL ON TABLE "public"."assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."assignments" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";



GRANT ALL ON TABLE "public"."class_subjects" TO "anon";
GRANT ALL ON TABLE "public"."class_subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."class_subjects" TO "service_role";



GRANT ALL ON TABLE "public"."classes" TO "anon";
GRANT ALL ON TABLE "public"."classes" TO "authenticated";
GRANT ALL ON TABLE "public"."classes" TO "service_role";



GRANT ALL ON TABLE "public"."comment_likes" TO "anon";
GRANT ALL ON TABLE "public"."comment_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_likes" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."community_posts" TO "anon";
GRANT ALL ON TABLE "public"."community_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."community_posts" TO "service_role";



GRANT ALL ON TABLE "public"."coupon_usages" TO "anon";
GRANT ALL ON TABLE "public"."coupon_usages" TO "authenticated";
GRANT ALL ON TABLE "public"."coupon_usages" TO "service_role";



GRANT ALL ON TABLE "public"."coupons" TO "anon";
GRANT ALL ON TABLE "public"."coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."coupons" TO "service_role";



GRANT ALL ON TABLE "public"."course_sections" TO "anon";
GRANT ALL ON TABLE "public"."course_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."course_sections" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."education_levels" TO "anon";
GRANT ALL ON TABLE "public"."education_levels" TO "authenticated";
GRANT ALL ON TABLE "public"."education_levels" TO "service_role";



GRANT ALL ON TABLE "public"."education_systems" TO "anon";
GRANT ALL ON TABLE "public"."education_systems" TO "authenticated";
GRANT ALL ON TABLE "public"."education_systems" TO "service_role";



GRANT ALL ON TABLE "public"."exam_answers" TO "anon";
GRANT ALL ON TABLE "public"."exam_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."exam_answers" TO "service_role";



GRANT ALL ON TABLE "public"."exam_attempts" TO "anon";
GRANT ALL ON TABLE "public"."exam_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."exam_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."exam_questions" TO "anon";
GRANT ALL ON TABLE "public"."exam_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."exam_questions" TO "service_role";



GRANT ALL ON TABLE "public"."exams" TO "anon";
GRANT ALL ON TABLE "public"."exams" TO "authenticated";
GRANT ALL ON TABLE "public"."exams" TO "service_role";



GRANT ALL ON TABLE "public"."flashcard_reviews" TO "anon";
GRANT ALL ON TABLE "public"."flashcard_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."flashcard_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."flashcards" TO "anon";
GRANT ALL ON TABLE "public"."flashcards" TO "authenticated";
GRANT ALL ON TABLE "public"."flashcards" TO "service_role";



GRANT ALL ON TABLE "public"."forum_members" TO "anon";
GRANT ALL ON TABLE "public"."forum_members" TO "authenticated";
GRANT ALL ON TABLE "public"."forum_members" TO "service_role";



GRANT ALL ON TABLE "public"."forums" TO "anon";
GRANT ALL ON TABLE "public"."forums" TO "authenticated";
GRANT ALL ON TABLE "public"."forums" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."leaderboards" TO "anon";
GRANT ALL ON TABLE "public"."leaderboards" TO "authenticated";
GRANT ALL ON TABLE "public"."leaderboards" TO "service_role";



GRANT ALL ON TABLE "public"."lesson_progress" TO "anon";
GRANT ALL ON TABLE "public"."lesson_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_progress" TO "service_role";



GRANT ALL ON TABLE "public"."lesson_resources" TO "anon";
GRANT ALL ON TABLE "public"."lesson_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_resources" TO "service_role";



GRANT ALL ON TABLE "public"."lessons" TO "anon";
GRANT ALL ON TABLE "public"."lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."lessons" TO "service_role";



GRANT ALL ON TABLE "public"."library_resources" TO "anon";
GRANT ALL ON TABLE "public"."library_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."library_resources" TO "service_role";



GRANT ALL ON TABLE "public"."live_classes" TO "anon";
GRANT ALL ON TABLE "public"."live_classes" TO "authenticated";
GRANT ALL ON TABLE "public"."live_classes" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."parent_children" TO "anon";
GRANT ALL ON TABLE "public"."parent_children" TO "authenticated";
GRANT ALL ON TABLE "public"."parent_children" TO "service_role";



GRANT ALL ON TABLE "public"."parents" TO "anon";
GRANT ALL ON TABLE "public"."parents" TO "authenticated";
GRANT ALL ON TABLE "public"."parents" TO "service_role";



GRANT ALL ON TABLE "public"."password_resets" TO "anon";
GRANT ALL ON TABLE "public"."password_resets" TO "authenticated";
GRANT ALL ON TABLE "public"."password_resets" TO "service_role";



GRANT ALL ON TABLE "public"."past_question_files" TO "anon";
GRANT ALL ON TABLE "public"."past_question_files" TO "authenticated";
GRANT ALL ON TABLE "public"."past_question_files" TO "service_role";



GRANT ALL ON TABLE "public"."past_questions" TO "anon";
GRANT ALL ON TABLE "public"."past_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."past_questions" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."points_history" TO "anon";
GRANT ALL ON TABLE "public"."points_history" TO "authenticated";
GRANT ALL ON TABLE "public"."points_history" TO "service_role";



GRANT ALL ON TABLE "public"."post_likes" TO "anon";
GRANT ALL ON TABLE "public"."post_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."post_likes" TO "service_role";



GRANT ALL ON TABLE "public"."programs" TO "anon";
GRANT ALL ON TABLE "public"."programs" TO "authenticated";
GRANT ALL ON TABLE "public"."programs" TO "service_role";



GRANT ALL ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_attempts" TO "anon";
GRANT ALL ON TABLE "public"."quiz_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_questions" TO "anon";
GRANT ALL ON TABLE "public"."quiz_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_questions" TO "service_role";



GRANT ALL ON TABLE "public"."quizzes" TO "anon";
GRANT ALL ON TABLE "public"."quizzes" TO "authenticated";
GRANT ALL ON TABLE "public"."quizzes" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."rewards" TO "anon";
GRANT ALL ON TABLE "public"."rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."rewards" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."school_classes" TO "anon";
GRANT ALL ON TABLE "public"."school_classes" TO "authenticated";
GRANT ALL ON TABLE "public"."school_classes" TO "service_role";



GRANT ALL ON TABLE "public"."school_students" TO "anon";
GRANT ALL ON TABLE "public"."school_students" TO "authenticated";
GRANT ALL ON TABLE "public"."school_students" TO "service_role";



GRANT ALL ON TABLE "public"."school_teachers" TO "anon";
GRANT ALL ON TABLE "public"."school_teachers" TO "authenticated";
GRANT ALL ON TABLE "public"."school_teachers" TO "service_role";



GRANT ALL ON TABLE "public"."schools" TO "anon";
GRANT ALL ON TABLE "public"."schools" TO "authenticated";
GRANT ALL ON TABLE "public"."schools" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."student_courses" TO "anon";
GRANT ALL ON TABLE "public"."student_courses" TO "authenticated";
GRANT ALL ON TABLE "public"."student_courses" TO "service_role";



GRANT ALL ON TABLE "public"."student_points" TO "anon";
GRANT ALL ON TABLE "public"."student_points" TO "authenticated";
GRANT ALL ON TABLE "public"."student_points" TO "service_role";



GRANT ALL ON TABLE "public"."study_group_members" TO "anon";
GRANT ALL ON TABLE "public"."study_group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."study_group_members" TO "service_role";



GRANT ALL ON TABLE "public"."study_group_messages" TO "anon";
GRANT ALL ON TABLE "public"."study_group_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."study_group_messages" TO "service_role";



GRANT ALL ON TABLE "public"."study_groups" TO "anon";
GRANT ALL ON TABLE "public"."study_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."study_groups" TO "service_role";



GRANT ALL ON TABLE "public"."study_sessions" TO "anon";
GRANT ALL ON TABLE "public"."study_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."study_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."subjects" TO "anon";
GRANT ALL ON TABLE "public"."subjects" TO "authenticated";
GRANT ALL ON TABLE "public"."subjects" TO "service_role";



GRANT ALL ON TABLE "public"."submissions" TO "anon";
GRANT ALL ON TABLE "public"."submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."submissions" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."subtopics" TO "anon";
GRANT ALL ON TABLE "public"."subtopics" TO "authenticated";
GRANT ALL ON TABLE "public"."subtopics" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_earnings" TO "anon";
GRANT ALL ON TABLE "public"."teacher_earnings" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher_earnings" TO "service_role";



GRANT ALL ON TABLE "public"."teachers" TO "anon";
GRANT ALL ON TABLE "public"."teachers" TO "authenticated";
GRANT ALL ON TABLE "public"."teachers" TO "service_role";



GRANT ALL ON TABLE "public"."terms" TO "anon";
GRANT ALL ON TABLE "public"."terms" TO "authenticated";
GRANT ALL ON TABLE "public"."terms" TO "service_role";



GRANT ALL ON TABLE "public"."topics" TO "anon";
GRANT ALL ON TABLE "public"."topics" TO "authenticated";
GRANT ALL ON TABLE "public"."topics" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_rewards" TO "anon";
GRANT ALL ON TABLE "public"."user_rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."user_rewards" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."wallet_transactions" TO "anon";
GRANT ALL ON TABLE "public"."wallet_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."wallets" TO "anon";
GRANT ALL ON TABLE "public"."wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."wallets" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































