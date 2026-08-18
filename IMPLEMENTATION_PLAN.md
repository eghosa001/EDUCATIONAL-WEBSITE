# Implementation Plan — Remaining Gaps (Revised)

> **Status: ~88% complete.** Core architecture, database, backend services, admin panel, and web app are substantially built. This file tracks remaining gaps verified against the actual codebase.

---

## Verified Complete (Implementation Plan Was Outdated)

| Item | Actual Status |
|---|---|
| Backend Flashcards module | ✅ `models/flashcard.model.js`, `flashcard.controller.js`, `routes/flashcard.routes.js`, `services/flashcard.service.js` all exist |
| Backend Live Classes module | ✅ `models/liveClass.model.js`, `liveClass.controller.js`, `routes/live-classes.routes.js`, `services/liveClass.service.js` all exist |
| Backend Past Questions module | ✅ `models/pastQuestion.model.js`, `pastQuestion.controller.js`, `routes/past-questions.routes.js`, `services/pastQuestion.service.js` all exist |
| Backend Library Models | ✅ `models/libraryResource.model.js` exists |
| Live class attendance migration | ✅ `add-live-class-attendance.sql` exists |
| Mobile AI Tutor page | ✅ Fully wired to API service + repository (496 lines, real API calls) |
| Mobile Live Classes page | ✅ Fully wired to API (416 lines), but action buttons have empty callbacks |
| Mobile Live Classes session page | ✅ 704 lines, functional chat/video UI (chat is mock, video is placeholder) |

---

## Task A — Backend: Missing Database Migrations (Independent)

### Context

15+ tables referenced in architecture (§29), backend models, and frontend code do not exist in any migration file. The `add-missing-tables.sql` covers flashcard_reviews, study_sessions, audit_logs, ai_usage, search_index, and notification_queue — but NOT the tables below.

**Reference files:**
- Existing migration pattern: `backend/scripts/migrations/add-live-class-attendance.sql` (20 lines, clean style)
- Model that expects these tables: `backend/src/library/models/libraryResource.model.js`
- Backend tests: `backend/src/coreServices.test.mjs`

### Tables to Create

Create one migration file: `backend/scripts/migrations/add-content-and-assessment-tables.sql`

```sql
-- ============================================
-- CONTENT & ASSESSMENT TABLES
-- ============================================

-- Course/Lesson Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('course', 'lesson', 'question')),
    resource_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_resource ON reviews(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- Aggregate Ratings
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('course', 'lesson', 'teacher')),
    target_id UUID NOT NULL,
    score DECIMAL(3,2) NOT NULL CHECK (score >= 1 AND score <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_ratings_target ON ratings(target_type, target_id);

-- Extended User Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    avatar_url TEXT,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Fine-Grained Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'manage')),
    condition JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, resource, action)
);
CREATE INDEX IF NOT EXISTS idx_permissions_role ON permissions(role_id);

-- MCQ Answer Options
CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_label VARCHAR(10) NOT NULL CHECK (option_label IN ('A', 'B', 'C', 'D', 'E', 'F')),
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options(question_id);

-- Question-to-Topic Associations (many-to-many)
CREATE TABLE IF NOT EXISTS question_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(question_id, topic_id)
);
CREATE INDEX IF NOT EXISTS idx_question_topics_question ON question_topics(question_id);
CREATE INDEX IF NOT EXISTS idx_question_topics_topic ON question_topics(topic_id);

-- Question Explanations
CREATE TABLE IF NOT EXISTS question_explanations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    explanation_text TEXT NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_question_explanations_question ON question_explanations(question_id);

-- Exam Result Summaries
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score DECIMAL(5,2),
    total_questions INTEGER,
    correct_answers INTEGER,
    time_taken INTEGER,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    answers JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam ON exam_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_user ON exam_results(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_status ON exam_results(status);

-- Assignment/Course Grades
CREATE TABLE IF NOT EXISTS grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
    grade DECIMAL(5,2),
    percentage DECIMAL(5,2),
    comments TEXT,
    graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    graded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_course ON grades(course_id);

-- Aggregated Student Progress
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,
    lessons_total INTEGER DEFAULT 0,
    quizzes_taken INTEGER DEFAULT 0,
    quizzes_passed INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, subject_id, topic_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_student_progress_user ON student_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_course ON student_progress(course_id);

-- Teacher-Course Assignments
CREATE TABLE IF NOT EXISTS teacher_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role VARCHAR(20) DEFAULT 'instructor' CHECK (role IN ('instructor', 'assistant', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(teacher_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_teacher_courses_teacher ON teacher_courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_courses_course ON teacher_courses(course_id);

-- Video Metadata (separate from lesson_resources for analytics)
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    title VARCHAR(300),
    description TEXT,
    upload_status VARCHAR(20) DEFAULT 'pending' CHECK (upload_status IN ('pending', 'processing', 'ready', 'failed')),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_videos_lesson ON videos(lesson_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(upload_status);

-- Document Metadata
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(300) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(50),
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_subject ON documents(subject_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

-- Image Metadata
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    alt_text VARCHAR(300),
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_images_uploaded_by ON images(uploaded_by);

-- Semesters
CREATE TABLE IF NOT EXISTS semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    education_level_id UUID REFERENCES education_levels(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_semesters_active ON semesters(is_active);
CREATE INDEX IF NOT EXISTS idx_semesters_level ON semesters(education_level_id);
```

### Acceptance Criteria

- [ ] File created at exact path: `backend/scripts/migrations/add-content-and-assessment-tables.sql`
- [ ] All 15 tables present with correct column names matching model references
- [ ] All tables use `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- [ ] Foreign keys reference correct parent tables with appropriate `ON DELETE` behavior
- [ ] CHECK constraints on enum-like columns (ratings 1-5, statuses, etc.)
- [ ] At least one index per table (covering foreign keys and common query patterns)
- [ ] Follows existing style: blank line between tables, comment header per logical group
- [ ] `created_at` and `updated_at` timestamps on all tables
- [ ] No duplicate table names with existing migrations

### Verification

After applying migration, run:
```bash
cd backend && node -e "
import('./src/common/database/index.js').then(async m => {
  const tables = await m.query(\"SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('reviews','ratings','profiles','permissions','question_options','question_topics','question_explanations','exam_results','grades','student_progress','teacher_courses','videos','documents','images','semesters') ORDER BY table_name\");
  console.log('Created tables:', tables.rows.map(r => r.table_name).join(', '));
});
"
```

---

## Task B — Mobile: Complete Remaining Features (Independent of Task A)

All work is in `mobile/lib/`. Use Flutter + Riverpod + Dio. Follow patterns from existing repositories.

---

### B1 — Notification Repository + Page Wiring

**Current state:** `notifications_page.dart` has 138 lines of hardcoded data. No repository file exists.

**Backend endpoints** (from `notification.routes.js`):
- `GET /api/v1/notifications` — list notifications (paginated)
- `PATCH /api/v1/notifications/:id/read` — mark single as read
- `POST /api/v1/notifications/read-all` — mark all as read
- `DELETE /api/v1/notifications/:id` — delete notification

#### Step 1: Create notification repository

**File:** `mobile/lib/shared/repositories/notification_repository.dart`

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';

class NotificationRepository {
  final ApiClient _apiClient;

  NotificationRepository(this._apiClient);

  Future<Map<String, dynamic>> getNotifications({
    int page = 1,
    int limit = 20,
    bool? unreadOnly,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.notifications,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (unreadOnly != null) 'unreadOnly': unreadOnly,
      },
    );
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<int> getUnreadCount() async {
    final response = await _apiClient.dio.get(
      AppEndpoints.notifications,
      queryParameters: {'unreadOnly': true, 'limit': 1},
    );
    final data = response.data['data'] as Map<String, dynamic>?;
    return data?['unreadCount'] as int? ?? 0;
  }

  Future<void> markAsRead(String notificationId) async {
    await _apiClient.dio.patch(
      AppEndpoints.notificationsMarkRead.replaceFirst('{id}', notificationId),
    );
  }

  Future<void> markAllAsRead() async {
    await _apiClient.dio.post(AppEndpoints.notificationsMarkAllRead);
  }

  Future<void> deleteNotification(String notificationId) async {
    await _apiClient.dio.delete(
      '${AppEndpoints.notifications}/${notificationId}',
    );
  }
}

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return NotificationRepository(apiClient);
});
```

#### Step 2: Update notifications page

**File:** `mobile/lib/features/notifications/presentation/pages/notifications_page.dart`

Replace hardcoded list with:
- `ConsumerStatefulWidget` with `_isLoading`, `_notifications`, `_page` state
- Load from `notificationRepositoryProvider.getNotifications()` on init
- Pull-to-refresh via `RefreshIndicator`
- "Mark all read" button calls `markAllAsRead()`
- Each item tap calls `markAsRead(id)` and navigates to relevant screen
- Show loading spinner while fetching
- Show empty state when no notifications

#### Step 3: Update repository index

**File:** `mobile/lib/shared/repositories/index.dart`

Add: `export 'notification_repository.dart';`

---

### B2 — Question / Past Questions Repository + Page Wiring

**Current state:** `questions_page.dart` has 93 lines with hardcoded JAMB/WAEC/NECO/NABTEB. No repository file exists.

**Backend endpoints** (from `past-questions.routes.js`):
- `GET /api/v1/past-questions/boards` — list boards
- `GET /api/v1/past-questions` — list questions (filterable by board, year, subject, etc.)
- `GET /api/v1/past-questions/boards/:board/topics` — topics for a board
- `GET /api/v1/past-questions/boards/:board/practice` — practice questions
- `GET /api/v1/past-questions/boards/:board/timed-test` — timed test generation

#### Step 1: Add missing endpoints

**File:** `mobile/lib/core/constants/app_endpoints.dart`

Add after the existing past questions block (~line 62):
```dart
// Past Questions (extended)
static const String pastQuestionsBoards = '/past-questions/boards';
static const String pastQuestionsPractice = '/past-questions/boards/{board}/practice';
static const String pastQuestionsTimedTest = '/past-questions/boards/{board}/timed-test';
static const String pastQuestionsTopics = '/past-questions/boards/{board}/topics';
```

#### Step 2: Create question repository

**File:** `mobile/lib/shared/repositories/question_repository.dart`

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';

class QuestionRepository {
  final ApiClient _apiClient;

  QuestionRepository(this._apiClient);

  Future<List<dynamic>> getBoards() async {
    final response = await _apiClient.dio.get(AppEndpoints.pastQuestionsBoards);
    return List<dynamic>.from(response.data['data']['boards'] as List? ?? []);
  }

  Future<Map<String, dynamic>> getQuestions({
    String? board,
    String? subjectId,
    int? year,
    String? topicId,
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.pastQuestions,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (board != null) 'board': board,
        if (subjectId != null) 'subjectId': subjectId,
        if (year != null) 'year': year,
        if (topicId != null) 'topicId': topicId,
      },
    );
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getQuestion(String questionId) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.pastQuestionsDetail.replaceFirst('{id}', questionId),
    );
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<List<dynamic>> getTopicsByBoard(String board) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.pastQuestionsTopics.replaceFirst('{board}', board),
    );
    return List<dynamic>.from(response.data['data']['topics'] as List? ?? []);
  }

  Future<List<dynamic>> getPracticeQuestions({
    required String board,
    String? subjectId,
    String? topicId,
    int count = 20,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.pastQuestionsPractice
          .replaceFirst('{board}', board),
      queryParameters: {
        'subjectId': subjectId,
        'topicId': topicId,
        'count': count,
      },
    );
    return List<dynamic>.from(response.data['data']['questions'] as List? ?? []);
  }

  Future<Map<String, dynamic>> generateTimedTest({
    required String board,
    String? subjectId,
    int count = 40,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.pastQuestionsTimedTest
          .replaceFirst('{board}', board),
      queryParameters: {'subjectId': subjectId, 'count': count},
    );
    return response.data['data'] as Map<String, dynamic>;
  }
}

final questionRepositoryProvider = Provider<QuestionRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return QuestionRepository(apiClient);
});
```

#### Step 3: Update questions page

**File:** `mobile/lib/features/questions/presentation/pages/questions_page.dart`

Convert to `ConsumerStatefulWidget`:
- State: `_selectedBoard`, `_isLoading`, `_subjects` (list), `_page`
- On board tap: call `questionRepositoryProvider.getTopicsByBoard(board)` → `_subjects`
- Render subjects from API instead of hardcoded list
- Navigate to `/past-questions/{board}/{subjectName}` on subject tap
- Add loading indicator
- Keep the existing `_SubjectCard` widget pattern

#### Step 4: Update repository index

**File:** `mobile/lib/shared/repositories/index.dart`

Add: `export 'question_repository.dart';`

---

### B3 — DI Container

**Current state:** `mobile/lib/di/` directory is empty. Providers are scattered across `app_providers.dart` and individual repository files.

#### Step 1: Create container

**File:** `mobile/lib/di/container.dart`

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../core/storage/storage_service.dart';
import '../shared/services/auth/auth_service.dart';
import '../shared/services/api/course_service.dart';
import '../shared/services/api/lesson_service.dart';
import '../shared/services/api/exam_service.dart';
import '../shared/services/api/library_service.dart';
import '../shared/services/api/progress_service.dart';
import '../shared/services/api/payment_service.dart';
import '../shared/services/api/user_service.dart';
import '../shared/services/ai_tutor_service.dart';
import '../shared/repositories/course_repository.dart';
import '../shared/repositories/lesson_repository.dart';
import '../shared/repositories/exam_repository.dart';
import '../shared/repositories/library_repository.dart';
import '../shared/repositories/progress_repository.dart';
import '../shared/repositories/gamification_repository.dart';
import '../shared/repositories/live_class_repository.dart';
import '../shared/repositories/ai_tutor_repository.dart';
import '../shared/repositories/notification_repository.dart';
import '../shared/repositories/question_repository.dart';

// Core infrastructure
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());
final storageServiceProvider = Provider<StorageService>((ref) => StorageService());

// Services
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(client: ref.watch(apiClientProvider));
});
final courseServiceProvider = Provider<CourseService>((ref) {
  return CourseService(client: ref.watch(apiClientProvider));
});
final lessonServiceProvider = Provider<LessonService>((ref) {
  return LessonService(client: ref.watch(apiClientProvider));
});
final examServiceProvider = Provider<ExamService>((ref) {
  return ExamService(client: ref.watch(apiClientProvider));
});
final libraryServiceProvider = Provider<LibraryService>((ref) {
  return LibraryService(client: ref.watch(apiClientProvider));
});
final progressServiceProvider = Provider<ProgressService>((ref) {
  return ProgressService(client: ref.watch(apiClientProvider));
});
final paymentServiceProvider = Provider<PaymentService>((ref) {
  return PaymentService(client: ref.watch(apiClientProvider));
});
final userServiceProvider = Provider<UserService>((ref) {
  return UserService(client: ref.watch(apiClientProvider));
});
final aiTutorServiceProvider = Provider<AiTutorService>((ref) => AiTutorService());

// Repositories
final courseRepositoryProvider = Provider<CourseRepository>((ref) {
  return CourseRepository(ref.watch(apiClientProvider));
});
final lessonRepositoryProvider = Provider<LessonRepository>((ref) {
  return LessonRepository(ref.watch(apiClientProvider));
});
final examRepositoryProvider = Provider<ExamRepository>((ref) {
  return ExamRepository(ref.watch(apiClientProvider));
});
final libraryRepositoryProvider = Provider<LibraryRepository>((ref) {
  return LibraryRepository(ref.watch(apiClientProvider));
});
final progressRepositoryProvider = Provider<ProgressRepository>((ref) {
  return ProgressRepository(ref.watch(apiClientProvider));
});
final gamificationRepositoryProvider = Provider<GamificationRepository>((ref) {
  return GamificationRepository(ref.watch(apiClientProvider));
});
final liveClassRepositoryProvider = Provider<LiveClassRepository>((ref) {
  return LiveClassRepository(ref.watch(apiClientProvider));
});
final aiTutorRepositoryProvider = Provider<AiTutorRepository>((ref) {
  return AiTutorRepository(
    service: ref.watch(aiTutorServiceProvider),
    storage: ref.watch(storageServiceProvider),
  );
});
final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository(ref.watch(apiClientProvider));
});
final questionRepositoryProvider = Provider<QuestionRepository>((ref) {
  return QuestionRepository(ref.watch(apiClientProvider));
});

// Export all providers
export 'container.dart';
```

#### Step 2: Update main.dart

**File:** `mobile/lib/main.dart`

Ensure app is wrapped with `ProviderScope`:
```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'di/container.dart'; // or however you structure exports

void main() {
  runApp(const ProviderScope(child: EduApp()));
}
```

#### Step 3: Create index export

**File:** `mobile/lib/di/index.dart`
```dart
export 'container.dart';
```

---

### B4 — Live Classes: Wire Action Buttons

**Current state:** Pages exist and call the repository, but action buttons have empty `onPressed: () {}`.

#### Step 1: Wire live classes page buttons

**File:** `mobile/lib/features/live_classes/presentation/pages/live_classes_page.dart`

In `_buildActionRow`, replace empty callbacks:

```dart
Widget _buildActionRow(ThemeData theme, bool isLive, bool isUpcoming, bool isEnded) {
  if (isLive) {
    return Row(
      children: [
        Expanded(
          child: EduButton(
            label: 'Join Class',
            onPressed: () => context.push('/live-classes/${classItem.id}'),
            color: theme.colorScheme.primary,
          ),
        ),
        const SizedBox(width: 8),
        EduButton(
          label: 'Watch',
          onPressed: () => context.push('/live-classes/${classItem.id}'),
          isOutlined: true,
          textColor: theme.colorScheme.primary,
        ),
      ],
    );
  }
  if (isUpcoming) {
    return Row(
      children: [
        Expanded(
          child: EduButton(
            label: 'Remind Me',
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Reminder set!')),
              );
            },
            isOutlined: true,
            textColor: theme.colorScheme.primary,
          ),
        ),
        const SizedBox(width: 8),
        EduButton(
          label: 'Details',
          onPressed: () => context.push('/live-classes/${classItem.id}'),
        ),
      ],
    );
  }
  if (isEnded) {
    return EduButton(
      label: 'View Recording',
      onPressed: () => context.push('/live-classes/${classItem.id}'),
      isOutlined: true,
      textColor: theme.colorScheme.primary,
    );
  }
  return const SizedBox.shrink();
}
```

Also wire the FAB to actually create a class (if user is teacher):
```dart
floatingActionButton: FloatingActionButton.extended(
  onPressed: () {
    // Check if user is teacher, then navigate to create screen
    // For now, show snackbar if not teacher
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Schedule class feature coming soon')),
    );
  },
  backgroundColor: theme.colorScheme.primary,
  icon: const Icon(Icons.add),
  label: const Text('Schedule'),
),
```

#### Step 2: Wire class session page

**File:** `mobile/lib/features/live_classes/presentation/pages/class_session_page.dart`

The `_sendChatMessage` method currently creates a local mock message. Two options:

**Option A (quick):** Keep mock for now but add visual indicator that chat is local-only
**Option B (full):** Create a `live_class_chat` backend endpoint and integrate it

For Option A, just add a small label under the input:
```dart
Text(
  'Chat is available during live sessions',
  style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
),
```

For video integration, check existing providers:
- `jitsi_provider.dart` — Jitsi Meet integration
- `twilio_provider.dart` — Twilio Video integration
- `video_provider.dart` — Abstract video provider interface

Wire `_buildVideoPlayer` to use the appropriate provider based on `classItem.meetingUrl`:
```dart
Widget _buildVideoPlayer(ThemeData theme) {
  return Stack(
    children: [
      // TODO: Integrate Jitsi/Twilio based on meetingUrl
      // For now show meeting URL as deep link
      Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.videocam_rounded, size: 80, color: Colors.white38),
            const SizedBox(height: 16),
            Text(
              'Join via: ${_classData!.meetingUrl}',
              style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white54),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _openMeetingUrl(),
              child: const Text('Open in Browser'),
            ),
          ],
        ),
      ),
    ],
  );
}

Future<void> _openMeetingUrl() async {
  // Use url_launcher to open the meeting URL
  // import 'package:url_launcher/url_launcher.dart';
  // await launchUrl(Uri.parse(_classData!.meetingUrl));
}
```

---

### B5 — AI Tutor: Context & History Polish

**Current state:** Service and repository exist and work. But no student context (level/subject) is passed, and conversation history is lost between sessions.

#### Step 1: Add context parameters to AI tutor service

**File:** `mobile/lib/shared/services/ai_tutor_service.dart`

Add optional context params to `chat()`:
```dart
Future<AiTutorResponse> chat({
  required String message,
  String? subjectId,
  String? topicId,
  String? studentLevel,  // e.g., "SS2", "JAMB"
}) async {
  // ... existing code ...
  final body = jsonEncode({
    'messages': messages,
    if (subjectId != null) 'subjectId': subjectId,
    if (topicId != null) 'topicId': topicId,
    if (studentLevel != null) 'studentLevel': studentLevel,
    if (_sessionId != null && _sessionId!.isNotEmpty) 'sessionId': _sessionId,
  });
  // ... rest unchanged ...
}
```

#### Step 2: Persist conversation history

**File:** `mobile/lib/features/ai_tutor/presentation/pages/ai_tutor_page.dart`

Add local storage persistence using `storageServiceProvider`:
```dart
// In state class, add:
final List<Map<String, String>> _history = [];

@override
void initState() {
  super.initState();
  _loadHistory();
}

Future<void> _loadHistory() async {
  final storage = ref.read(storageServiceProvider);
  final saved = storage.getString('ai_tutor_history');
  if (saved != null) {
    try {
      setState(() {
        _history.addAll(
          (jsonDecode(saved) as List)
              .map((e) => e as Map<String, String>)
              .toList(),
        );
        // Reconstruct _messages from history
        for (final msg in _history) {
          _messages.add(_Message(
            text: msg['text']!,
            isUser: msg['isUser'] == 'true',
          ));
        }
      });
    } catch (_) {}
  }
}

void _saveHistory() {
  final storage = ref.read(storageServiceProvider);
  storage.setString(
    'ai_tutor_history',
    jsonEncode(_messages.map((m) => {
      'text': m.text,
      'isUser': m.isUser.toString(),
    }).toList()),
  );
}
```

Call `_saveHistory()` after each successful message add.

---

## Execution Priority & Parallelism

```
TASK A (Backend DB) ──────────────────────────┐
                                               ├── CAN RUN IN PARALLEL
TASK B1 (Mobile Notifications) ────────────────┤     WITH EACH OTHER
TASK B2 (Mobile Questions) ────────────────────┤
                                               └── CAN RUN IN PARALLEL
TASK B3 (DI Container) ────────────────────────┘  (depends on B1/B2 repos)
TASK B4 (Live Classes wiring) ──────────────────┘  (independent)
TASK B5 (AI Tutor polish) ──────────────────────┘  (independent)
```

**Recommended split for two collaborators:**

| Collaborator | Focus | Tasks |
|---|---|---|
| **Backend Dev** | Task A | Create migration file, verify with query |
| **Mobile Dev** | Task B | B1, B2, B3, B4, B5 in sequence |

**Or split mobile between two devs:**

| Collaborator | Focus | Tasks |
|---|---|---|
| **Mobile Dev A** | Data layer | B1 (notifications repo+page), B2 (questions repo+page) |
| **Mobile Dev B** | Infrastructure + polish | B3 (DI), B4 (live classes wiring), B5 (AI tutor) |
