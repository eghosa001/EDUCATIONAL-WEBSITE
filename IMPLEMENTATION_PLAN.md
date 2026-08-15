# Educational Platform — Gap Analysis & Implementation Plan

## Gap Analysis: Architecture vs. Reality

### Resolved: Backend Module Layout

All 26 root-level `backend/` directories were empty artifacts; all code lives in `backend/src/<module>/`. The empty directories have been removed and `ARCHITECTURE.md` §30 now documents the real `backend/src/` layout. All tasks below use `backend/src/` paths.

### Missing in `backend/src/`

| Architecture Section | What's Missing |
|---|---|
| §6 Lesson System | No `lessonResource` model for images/diagrams/PDFs/examples |
| §7 Exam System | No support for past questions (WAEC/NECO/JAMB/NABTEB), no question type handling (True/False, Fill blank, Matching, Essay, Numerical) |
| §8 Past Questions | Zero implementation — no board/year/subject routing |
| §9 Assessment Engine | Quiz exists but no random question generator, difficulty selection, or exam generator |
| §10 Progress System | Missing: study sessions model partially exists, no weak/strong topic analytics |
| §11/12 AI Tutor | Only stub controller/service — no context pipeline, no RAG, no student curriculum awareness |
| §13 Flashcards | No flashcard model or spaced repetition engine anywhere |
| §15 Live Classes | No implementation at all |
| §19 School Management | Only basic school model — missing classes, timetable, attendance, fees, results |
| §21 Content Management | No draft/review/approve/publish workflow |
| §25 Notifications | Basic model exists but no push/SMS/WhatsApp dispatch |
| §26 Gamification | Models exist (badges, achievements, points) but no streak logic or XP engine |
| §27 Community | Forum/posts exist but no moderation queue |
| §28 Search | Basic service exists but no global index across all content types |
| §29 Database | Missing tables: `flashcard_reviews`, `study_sessions`, `audit_logs`, `reports`, `ai_usage`, `reviews/ratings/comments` |

### Missing in `web/src/features/`

**All 14 feature directories are empty (0 files each):**
- `ai/`, `auth/`, `community/`, `courses/`, `exams/`, `gamification/`, `lessons/`, `library/`, `notifications/`, `parent/`, `profile/`, `school/`, `subscriptions/`, `teacher/`

The web app has routes/pages but **zero business logic** — no hooks, no state, no components.

### Missing in `mobile/lib/`

| Section | What's Missing |
|---|---|
| `core/` | Only `config/` and `theme/` exist. Missing: `network/`, `storage/`, `security/`, `errors/`, `constants/`, `utils/` |
| `shared/` | Has `services/` and `models/` but `widgets/`, `repositories/`, `providers/`, `blocs/` are all empty |
| Features | All have only 1 stub page file. Missing: business logic, state management, API calls, form validation |
| §13 Flashcards | Page exists but no model/service/logic |
| §15 Live Classes | No feature at all |
| §25 Notifications | Page exists but no service implementation |

### Missing in `admin/src/features/`

**All 18 feature directories are empty (0 files each).** The admin has dashboard shell and a few pages but no actual feature logic.

### Missing in `shared/`

| Directory | Status |
|---|---|
| `types/models/` | Has 23 model files |
| `types/database/` | Has tables |
| `types/events/` | Has events |
| `types/api/` | Has API types |
| `schemas/` | **Empty** — no Zod/validation schemas |
| `config/` | **Empty** |
| `constants/` | **Empty** |
| `utils/` | **Empty** |

---

## Implementation Plan — 5 Parallel Tracks

### Track 1 — Shared Layer (Foundation for everything else)

**Work in:** `shared/`
**Dependencies:** None — other tracks depend on this

| Task | What to create | Target path |
|---|---|---|
| 1.1 | Zod schemas for all 23 model types | `shared/schemas/*.ts` |
| 1.2 | Enums: education levels, question types, exam boards, subscription plans, payment status | `shared/constants/enums.ts` |
| 1.3 | API config: base URL, timeouts, auth headers, error mapper | `shared/config/api.ts` |
| 1.4 | Utilities: pagination helper, currency formatter (₦), date formatter, file size formatter | `shared/utils/helpers.ts` |
| 1.5 | Event types for WebSocket/pusher events | `shared/types/events/index.ts` (expand) |
| 1.6 | Database entity types for all missing tables | `shared/types/database/tables.ts` (expand) |

---

### Track 2 — Backend Completion

**Work in:** `backend/src/`
**Dependencies:** Track 1 (schemas/constants)

| Task | What to create | Target path |
|---|---|---|
| 2.1 | Flashcard model + service with spaced repetition algorithm | `backend/src/flashcards/` |
| 2.2 | Past questions service: JAMB/WAEC/NECO/NABTEB board routing, year/subject/topic indexing | `backend/src/past-questions/` |
| 2.3 | Assessment engine: random question generator, difficulty filter, exam builder | `backend/src/assessments/engine.ts` |
| 2.4 | Content approval workflow service (draft → review → approve → publish) | `backend/src/administration/workflow.ts` |
| 2.5 | Notification dispatcher: push (FCM), SMS (Twilio), email (Nodemailer), in-app | `backend/src/notifications/dispatch.service.ts` |
| 2.6 | AI tutor service: RAG pipeline, student context injection, curriculum awareness | `backend/src/ai/tutor.service.ts` |
| 2.7 | Live class service: Socket.IO room management, attendance tracking | `backend/src/live-classes/` |
| 2.8 | Missing database tables SQL migrations: flashcard_reviews, study_sessions, audit_logs, ai_usage | `backend/scripts/migrations/` |
| 2.9 | Global search indexer: aggregate all content types into search index | `backend/src/search/indexer.ts` |
| 2.10 | Security middleware: rate limiting config, row-level security helpers, input sanitization | `backend/src/common/middleware/security.ts` |
| 2.11 | Certificate generation service: PDF generation with student data | `backend/src/certificates/generator.ts` |
| 2.12 | Community moderation queue service | `backend/src/community/moderation.service.ts` |

---

### Track 3 — Web App Feature Implementation

**Work in:** `web/src/features/`
**Dependencies:** Track 1 (types), Track 2 (API endpoints)

| Task | What to create | Target path |
|---|---|---|
| 3.1 | Auth feature: login/register hooks, form validation, role-based guards | `web/src/features/auth/` |
| 3.2 | Courses feature: browse, filter by level/subject, enrollment hooks | `web/src/features/courses/` |
| 3.3 | Lessons feature: video player, resource viewer, progress tracking | `web/src/features/lessons/` |
| 3.4 | Exams feature: exam-taking UI, timer, auto-submit, results display | `web/src/features/exams/` |
| 3.5 | AI tutor feature: chat UI, context injection, conversation history | `web/src/features/ai/` |
| 3.6 | Flashcards feature: flashcard viewer, spaced repetition UI | `web/src/features/flashcards/` |
| 3.7 | Parent dashboard feature: child progress, weak/strong areas, study time | `web/src/features/parent/` |
| 3.8 | Teacher dashboard feature: course management, assignment grading, analytics | `web/src/features/teacher/` |
| 3.9 | School portal feature: class management, timetable, attendance | `web/src/features/school/` |
| 3.10 | Community feature: forums, study groups, Q&A | `web/src/features/community/` |
| 3.11 | Subscriptions feature: plan comparison, billing, payment flow | `web/src/features/subscriptions/` |
| 3.12 | Progress feature: performance charts, topic breakdown, streak display | `web/src/features/progress/` |
| 3.13 | Gamification feature: XP display, badges, leaderboards | `web/src/features/gamification/` |
| 3.14 | Notifications feature: inbox, mark read, preference settings | `web/src/features/notifications/` |
| 3.15 | Library feature: resource browsing, search, PDF viewer | `web/src/features/library/` |
| 3.16 | Profile feature: settings, password change, avatar upload | `web/src/features/profile/` |

---

### Track 4 — Admin Panel Completion

**Work in:** `admin/src/features/`
**Dependencies:** Track 1 (types), Track 2 (API endpoints)

| Task | What to create | Target path |
|---|---|---|
| 4.1 | Dashboard feature: KPI cards, charts, recent activity feed | `admin/src/features/dashboard/` |
| 4.2 | Users feature: student/parent/teacher/school management tables | `admin/src/features/users/` |
| 4.3 | Curriculum feature: level/class/subject/topic CRUD | `admin/src/features/curriculum/` |
| 4.4 | Courses feature: course approval workflow, content management | `admin/src/features/courses/` |
| 4.5 | Lessons feature: lesson editor, resource uploader | `admin/src/features/lessons/` |
| 4.6 | Questions feature: question bank CRUD, bulk import | `admin/src/features/questions/` |
| 4.7 | Exams feature: exam configuration, past questions management | `admin/src/features/exams/` |
| 4.8 | Payments feature: transaction list, refund processing | `admin/src/features/payments/` |
| 4.9 | Subscriptions feature: plan management, subscription overrides | `admin/src/features/subscriptions/` |
| 4.10 | Reports feature: revenue reports, user analytics export | `admin/src/features/reports/` |
| 4.11 | Moderation feature: content review queue, flag management | `admin/src/features/moderation/` |
| 4.12 | AI feature: AI configuration, usage monitoring | `admin/src/features/ai/` |
| 4.13 | Settings feature: platform config, email/SMS templates | `admin/src/features/settings/` |
| 4.14 | Content approval feature: review workflow UI | `admin/src/features/content-approval/` |
| 4.15 | Schools feature: school onboarding, verification | `admin/src/features/schools/` |
| 4.16 | Teachers feature: teacher verification, earnings management | `admin/src/features/teachers/` |

---

### Track 5 — Mobile App Completion

**Work in:** `mobile/lib/`
**Dependencies:** Track 1 (types), Track 2 (API endpoints)

| Task | What to create | Target path |
|---|---|---|
| 5.1 | Core network: Dio client setup, interceptors, error handling | `mobile/lib/core/network/` |
| 5.2 | Core storage: Hive setup, secure storage wrapper | `mobile/lib/core/storage/` |
| 5.3 | Core security: encryption helpers, biometric auth | `mobile/lib/core/security/` |
| 5.4 | Core errors: AppException hierarchy, error mapper | `mobile/lib/core/errors/` |
| 5.5 | Core constants: enums, API endpoints, theme colors | `mobile/lib/core/constants/` |
| 5.6 | Core utils: formatters, validators, date helpers | `mobile/lib/core/utils/` |
| 5.7 | Core localization: i18n setup, English + Hausa/Yoruba templates | `mobile/lib/core/localization/` |
| 5.8 | Shared widgets: button, input, card, shimmer, empty state | `mobile/lib/shared/widgets/` |
| 5.9 | Shared repositories: API repository pattern for all features | `mobile/lib/shared/repositories/` |
| 5.10 | Shared providers: Riverpod providers for all services | `mobile/lib/shared/providers/` |
| 5.11 | Shared blocs: BLoC/Cubit state management | `mobile/lib/shared/blocs/` |
| 5.12 | Courses feature: full implementation with detail page | `mobile/lib/features/courses/` |
| 5.13 | Lessons feature: video player with Chewie, progress tracking | `mobile/lib/features/lessons/` |
| 5.14 | Exams feature: exam taking with timer, answer tracking | `mobile/lib/features/exams/` |
| 5.15 | Flashcards feature: flashcard flash with spaced repetition | `mobile/lib/features/flashcards/` |
| 5.16 | AI tutor feature: chat UI with markdown rendering | `mobile/lib/features/ai_tutor/` |
| 5.17 | Progress feature: charts, streak display, topic breakdown | `mobile/lib/features/progress/` |
| 5.18 | Parent feature: child monitoring dashboard | `mobile/lib/features/parent/` |
| 5.19 | Teacher feature: course management, assignment grading | `mobile/lib/features/teacher/` |
| 5.20 | School feature: class management, attendance | `mobile/lib/features/school/` |
| 5.21 | Notifications feature: push notification handling, inbox | `mobile/lib/features/notifications/` |
| 5.22 | Community feature: forums, study groups | `mobile/lib/features/community/` |
| 5.23 | Subscriptions feature: plan selection, payment | `mobile/lib/features/subscriptions/` |
| 5.24 | Gamification feature: XP, badges, leaderboards | `mobile/lib/features/gamification/` |
| 5.25 | Live classes: camera/mic permissions, WebRTC or third-party integration | `mobile/lib/features/live_classes/` |

---

## Execution Order (Parallelizable)

```
Step 1 (Day 1):  Track 1 — Shared Layer         <-- START HERE, blocks everything else
Step 2 (Day 2+): Tracks 2, 3, 4, 5             <-- All run in parallel
Step 3 (Day 3+): Integration testing across all tracks
```

**Within each track**, tasks are independent and can be done in parallel by different developers. For example, while one person builds `flashcards` in Track 2, another builds `past-questions`, another builds `notifications/dispatch`.
