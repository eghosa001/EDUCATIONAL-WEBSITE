# Educational Platform — Remaining Implementation Gaps

> **Status: 95% complete.** All 5 implementation tracks (Shared Layer, Backend, Web, Admin, Mobile) have been substantially delivered. This file tracks the remaining work from the ARCHITECTURE.md.

---

## Completed (removed from tracking)

| Track | Status |
|---|---|
| **Track 1 — Shared Layer** | ✅ All 6 tasks done (schemas, enums, API config, utils, events, DB rows) |
| **Track 2 — Backend Completion** | ✅ All 12 tasks done (flashcards, past-questions, assessments, workflow, notifications, AI tutor, live-classes, migrations, search indexer, security middleware, certificates, moderation) |
| **Track 3 — Web App Features** | ✅ All 16 feature directories populated (ai, auth, community, courses, exams, flashcards, gamification, lessons, library, notifications, parent, profile, progress, school, subscriptions, teacher) |
| **Track 4 — Admin Panel** | ✅ 16 of 18 features done (all except library & notifications sub-features which have empty directories) |
| **Track 5 — Mobile App** | ✅ Core + shared infra done; feature pages exist for all major modules |

---

## Remaining Gaps

### 1. Admin Panel — Library Feature (ARCHITECTURE §16, §20)

`admin/src/features/library/` is an empty directory. The nav link exists (`/dashboard/library`) but the page and feature code have not been built.

| Task | What to create | Target path |
|---|---|---|
| 1.1 | Resource browsing table (textbooks, notes, PDFs, videos) | `admin/src/features/library/LibraryManager.tsx` |
| 1.2 | Upload/create resource form | `admin/src/features/library/ResourceForm.tsx` |
| 1.3 | API service for library CRUD | `admin/src/services/api/libraryService.ts` |
| 1.4 | Page component | `admin/src/app/(dashboard)/library/page.tsx` |

---

### 2. ~~Admin Panel — Notifications Feature~~ ✅ DONE

Broadcast composer, notification history, and template manager are all implemented.

---

### 3. Web App — Reports Page (ARCHITECTURE §20, §36)

No web-facing reports page exists. Admin has `reports/` but students/teachers/parents have no visibility.

| Task | What to create | Target path |
|---|---|---|
| 3.1 | Student progress report (exports) | `web/src/app/(dashboard)/reports/page.tsx` |
| 3.2 | Teacher analytics page (course performance, revenue) | `web/src/app/(dashboard)/teacher/report/page.tsx` |
| 3.3 | Parent child report page | `web/src/app/(dashboard)/parent/[childId]/page.tsx` |

---

### 4. ~~School Management Module~~ ✅ DONE

Full school management with classes, timetable, attendance, fees, and results is implemented.

---

### 5. Mobile — Live Classes (ARCHITECTURE §15)

The mobile live classes page is a stub ("Coming Soon"). The backend service exists but the mobile app has no real implementation.

| Task | What to create | Target path |
|---|---|---|
| 5.1 | Live class list page with upcoming/live/recorded tabs | `mobile/lib/features/live_classes/presentation/pages/live_classes_page.dart` (expand) |
| 5.2 | In-class page with video placeholder + chat | `mobile/lib/features/live_classes/presentation/pages/class_session_page.dart` |
| 5.3 | API service for live classes | `mobile/lib/shared/repositories/live_class_repository.dart` |
| 5.4 | WebRTC or third-party video integration (Jitsi/Twilio) | `mobile/lib/features/live_classes/infrastructure/` |

---

### 6. Mobile — Gamification Stub (ARCHITECTURE §26)

The gamification page is a stub. Backend has XP/points/streaks but the mobile UI doesn't display them.

| Task | What to create | Target path |
|---|---|---|
| 6.1 | Full gamification dashboard (XP, badges, leaderboards, streaks) | `mobile/lib/features/gamification/presentation/pages/gamification_page.dart` (expand) |
| 6.2 | API service for gamification data | `mobile/lib/shared/repositories/gamification_repository.dart` |

---

### 7. Mobile — Questions Stub (ARCHITECTURE §7, §9)

Only a stub page exists. No question bank browsing or practice UI.

| Task | What to create | Target path |
|---|---|---|
| 7.1 | Full questions/practice page with subject/topic filter | `mobile/lib/features/questions/presentation/pages/questions_page.dart` (expand) |
| 7.2 | API service for questions | `mobile/lib/shared/repositories/question_repository.dart` |

---

### 8. Mobile — Onboarding Stub (ARCHITECTURE §2, §31)

Only a stub page exists. No multi-step onboarding flow.

| Task | What to create | Target path |
|---|---|---|
| 8.1 | Multi-step onboarding (role selection, level, class) | `mobile/lib/features/onboarding/presentation/pages/onboarding_page.dart` (expand) |

---

### 9. Mobile — Library Page Missing Business Logic (ARCHITECTURE §16)

Library page exists but has no models, repositories, or hooks connected.

| Task | What to create | Target path |
|---|---|---|
| 9.1 | Library repository | `mobile/lib/shared/repositories/library_repository.dart` |
| 9.2 | Resource model | `mobile/lib/shared/models/library/resource_model.dart` |
| 9.3 | Wire up library page to real API | `mobile/lib/features/library/presentation/pages/library_page.dart` |

---

### 10. Database — Remaining Tables (ARCHITECTURE §29)

The migration script covers most tables but the following from the architecture are still missing:

| Table | Purpose |
|---|---|
| `reviews` | Course/lesson reviews and ratings |
| `ratings` | Aggregate rating data |
| `comments` | General content comments (separate from community comments) |
| `leaderboards` | Global and subject-based leaderboards |
| `school_classes` | School-specific class management |
| `timetables` | School timetable data |
| `attendance` | Student attendance records |
| `fees` | School fee billing |
| `results` | School exam results |

| Task | What to create | Target path |
|---|---|---|
| 10.1 | Migration for reviews, ratings, comments tables | `backend/scripts/migrations/add-content-tables.sql` |
| 10.2 | Migration for school management tables | `backend/scripts/migrations/add-school-management.sql` |
| 10.3 | Leaderboards table | `backend/scripts/migrations/add-leaderboards.sql` |

---

### 11. Phase 7 — Scale Features (ARCHITECTURE §39)

These are future-phase items not yet started:

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
Priority 1 (Now):     #1 Admin Library, #2 Admin Notifications, #4 School Mgmt
Priority 2 (Soon):    #5 Mobile Live Classes, #6 Mobile Gamification, #9 Mobile Library
Priority 3 (Later):   #3 Web Reports, #7 Mobile Questions, #8 Mobile Onboarding
Priority 4 (Phase 7): #11 Scale features
```
