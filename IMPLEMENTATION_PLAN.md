# Educational Platform — Remaining Implementation Gaps

> **Status: ~80% complete.** Core architecture, database, backend services, admin panel, and web app are substantially built. This file tracks remaining gaps from the ARCHITECTURE.md.

---

## Completed (removed from tracking)

| Track | Status |
|---|---|
| **Track 1 — Shared Layer** | ✅ All schemas, enums, API config, utils, events, DB rows implemented |
| **Track 2 — Backend Core** | ✅ Auth, users, education, curriculum, courses, lessons, questions, exams, assignments, progress, library, teachers, parents, schools, payments, subscriptions, notifications, gamification, community, search, certificates, analytics, reports, administration, storage, ai all have controllers + services + routes |
| **Track 3 — Web App** | ✅ Auth flows, dashboard, courses, lessons, exams, flashcards, gamification, library, notifications, progress, community, parent, profile, school, subscriptions, teacher, AI, reports all have page implementations with real API integration |
| **Track 4 — Admin Panel** | ✅ Dashboard, users, teachers, schools, curriculum, courses, lessons, questions, exams, payments, subscriptions, reports, moderation, content-approval, AI, settings, library (LibraryManager + ResourceForm), notifications (BroadcastComposer + TemplateManager) all implemented |
| **Track 5 — Mobile App** | ✅ Core infra, routing, auth, onboarding (180-line multi-step), library (real API), flashcards, gamification (715-line with API), courses, lessons, exams, progress, community, profile, parent, teacher, school, subscriptions all have implementations |
| **Database Migrations** | ✅ 77+ tables across init-db.sql, migrate-phase4.sql, migrate-phase5.sql, add-missing-tables.sql, add-school-management.sql, migrate-certificates.sql |

---

## Remaining Gaps

### 1. Backend — Flashcards Module (ARCHITECTURE §13)

Service exists (`flashcards/services/flashcard.service.js`) but no controller, models, or routes.

| Task | What to create | Target path |
|---|---|---|
| 1.1 | Flashcard model | `backend/src/flashcards/models/flashcard.model.js` |
| 1.2 | Flashcard controller | `backend/src/flashcards/flashcard.controller.js` |
| 1.3 | Flashcard routes | `backend/src/routes/flashcard.routes.js` |

---

### 2. Backend — Live Classes Module (ARCHITECTURE §15)

Service exists (`live-classes/services/liveClass.service.js`) but no controller, models, or routes. Table `live_class_attendance` is also missing from migrations.

| Task | What to create | Target path |
|---|---|---|
| 2.1 | Live class model | `backend/src/live-classes/models/liveClass.model.js` |
| 2.2 | Live class controller | `backend/src/live-classes/liveClass.controller.js` |
| 2.3 | Live class routes | `backend/src/routes/live-classes.routes.js` |
| 2.4 | Missing `live_class_attendance` table migration | `backend/scripts/migrations/add-live-class-attendance.sql` |

---

### 3. Backend — Past Questions Module (ARCHITECTURE §8)

Service exists (`past-questions/services/pastQuestion.service.js`) but no controller, models, or routes.

| Task | What to create | Target path |
|---|---|---|
| 3.1 | Past question model | `backend/src/past-questions/models/pastQuestion.model.js` |
| 3.2 | Past question controller | `backend/src/past-questions/pastQuestion.controller.js` |
| 3.3 | Past question routes | `backend/src/routes/past-questions.routes.js` |

---

### 4. Backend — Library Models (ARCHITECTURE §16)

Controller and service exist but the models directory is empty.

| Task | What to create | Target path |
|---|---|---|
| 4.1 | Library resource model | `backend/src/library/models/libraryResource.model.js` |

---

### 5. Mobile — Live Classes (ARCHITECTURE §15)

Page is a 33-line stub showing "Coming Soon". No repository, no real implementation.

| Task | What to create | Target path |
|---|---|---|
| 5.1 | Live class list page with upcoming/live/recorded tabs | `mobile/lib/features/live_classes/presentation/pages/live_classes_page.dart` (expand from stub) |
| 5.2 | In-class session page with video + chat | `mobile/lib/features/live_classes/presentation/pages/class_session_page.dart` |
| 5.3 | Live class repository | `mobile/lib/shared/repositories/live_class_repository.dart` |
| 5.4 | Video integration (Jitsi/Twilio/external provider) | `mobile/lib/features/live_classes/infrastructure/` |

---

### 6. Mobile — AI Tutor (ARCHITECTURE §11, §12)

Page has 324 lines of UI but uses hardcoded mock responses (`_getAIResponse`). No API service or repository.

| Task | What to create | Target path |
|---|---|---|
| 6.1 | AI tutor API service | `mobile/lib/shared/services/ai_tutor_service.dart` |
| 6.2 | AI tutor repository | `mobile/lib/shared/repositories/ai_tutor_repository.dart` |
| 6.3 | Wire up real API calls in AI tutor page | `mobile/lib/features/ai_tutor/presentation/pages/ai_tutor_page.dart` |

---

### 7. Mobile — Notifications (ARCHITECTURE §25)

Page has 138 lines with hardcoded notifications. No repository or API integration.

| Task | What to create | Target path |
|---|---|---|
| 7.1 | Notification repository | `mobile/lib/shared/repositories/notification_repository.dart` |
| 7.2 | Wire up real API calls in notifications page | `mobile/lib/features/notifications/presentation/pages/notifications_page.dart` |

---

### 8. Mobile — Questions / Past Questions (ARCHITECTURE §7, §8)

Page has hardcoded JAMB/WAEC/NECO/NABTEB data with empty callbacks. No repository or API integration.

| Task | What to create | Target path |
|---|---|---|
| 8.1 | Question repository | `mobile/lib/shared/repositories/question_repository.dart` |
| 8.2 | Wire up real API calls in questions page | `mobile/lib/features/questions/presentation/pages/questions_page.dart` |

---

### 9. Mobile — DI Container (ARCHITECTURE §31)

The `mobile/lib/di/` directory exists but is completely empty. No dependency injection setup.

| Task | What to create | Target path |
|---|---|---|
| 9.1 | DI container with all repositories and services | `mobile/lib/di/container.dart` |
| 9.2 | Register all features in DI | `mobile/lib/di/` |

---

### 10. Database — Missing Tables (ARCHITECTURE §29)

The following tables referenced in architecture and backend code are not in any migration:

| Table | Purpose |
|---|---|
| `reviews` | Course/lesson reviews |
| `ratings` | Aggregate rating data |
| `profiles` | Extended user profiles |
| `permissions` | Fine-grained permissions |
| `question_options` | MCQ/answer options |
| `question_topics` | Question-topic associations |
| `question_explanations` | Question explanations |
| `exam_results` | Exam result summaries |
| `grades` | Assignment/course grades |
| `student_progress` | Aggregated student progress |
| `teacher_courses` | Teacher-course assignments |
| `videos` | Video metadata (if separate from lesson_resources) |
| `documents` | Document metadata |
| `images` | Image metadata |
| `semesters` | Semester tracking |

| Task | What to create | Target path |
|---|---|---|
| 10.1 | Migration for content tables (reviews, ratings, profiles, permissions) | `backend/scripts/migrations/add-content-tables.sql` |
| 10.2 | Migration for question/exam tables | `backend/scripts/migrations/add-question-exam-tables.sql` |
| 10.3 | Migration for progress/grades tables | `backend/scripts/migrations/add-progress-tables.sql` |

---

### 11. Phase 7 — Scale Features (ARCHITECTURE §39)

| Feature | Status |
|---|---|
| Marketplace (teacher course sales commission) | Not started |
| Corporate training module | Not started |
| Multi-language support (beyond English) | Not started |
| Advanced analytics (predictive, cohort-based) | Not started |
| WhatsApp notifications | Not started (noted as future in §25) |

---

## Execution Priority

```
Priority 1 (Now):     #1 Flashcards backend, #2 Live Classes backend, #3 Past Questions backend, #4 Library models
Priority 2 (Soon):    #5 Mobile Live Classes, #6 Mobile AI Tutor, #7 Mobile Notifications, #8 Mobile Questions
Priority 3 (Later):   #9 Mobile DI Container, #10 Database missing tables
Priority 4 (Phase 7): #11 Scale features
```
