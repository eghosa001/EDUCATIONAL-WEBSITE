# THE GUIDE — Recommended Architecture

> **Project:** THE GUIDE Educational Platform  
> **Architecture:** Supabase-first, web/mobile/admin ecosystem  
> **Status:** Recommended replacement for the previous custom-backend-heavy architecture  
> **Updated:** 2026-08-21

---

## 1. Architecture Decision

THE GUIDE should **not** be built around a large custom Express/Node backend as the default path.

The recommended architecture is:

```text
                         THE GUIDE
                            |
             +--------------+---------------+
             |              |               |
          WEB APP       MOBILE APP       ADMIN APP
         Next.js        Flutter/React     Next.js
             |              |               |
             +--------------+---------------+
                            |
                    Supabase Platform
                            |
        +-------------------+-------------------+
        |                   |                   |
   PostgreSQL            Auth              Storage
   Database              Users              PDFs
   RLS                   Sessions            Videos
   Functions             OAuth               Images
        |                   |                   |
        +-------------------+-------------------+
                            |
                    Supabase Edge Functions
                            |
              +-------------+-------------+
              |             |             |
             AI          Payments     Background Jobs
```

### Core principle

Use Supabase for the majority of backend infrastructure:

- PostgreSQL database
- Authentication
- Row Level Security
- Storage
- Realtime
- APIs
- Edge Functions
- Database triggers
- Scheduled/async server-side work where appropriate

Use additional backend services only when Supabase does not provide the right tool for the job.

---

# 2. What Supabase Replaces

The old architecture created a large custom backend responsible for many things that Supabase can already provide.

### Old approach

```text
Frontend
   |
   v
Express Backend
   |
   +--> Custom Auth
   +--> Custom JWT
   +--> PostgreSQL
   +--> Storage
   +--> Business APIs
   |
   v
Supabase
```

### New approach

```text
Web / Mobile / Admin
          |
          v
      Supabase
   +------+------+
   |             |
Database       Auth
   |             |
Storage      Security/RLS
   |
Edge Functions
   |
AI / Payments / Protected Logic
```

The custom Express backend is therefore **removed from the critical path unless a feature specifically requires it**.

---

# 3. Responsibility Matrix

| Requirement | Recommended Service |
|---|---|
| User registration | Supabase Auth |
| Login/logout | Supabase Auth |
| Password reset | Supabase Auth |
| OAuth | Supabase Auth |
| Session management | Supabase Auth |
| User profiles | PostgreSQL |
| Roles | PostgreSQL + RLS |
| Permissions | PostgreSQL + RLS |
| Courses | PostgreSQL |
| Curriculum | PostgreSQL |
| Subjects | PostgreSQL |
| Topics | PostgreSQL |
| Lessons | PostgreSQL |
| Questions | PostgreSQL |
| Quizzes | PostgreSQL |
| Exams | PostgreSQL |
| Progress | PostgreSQL |
| Analytics data | PostgreSQL |
| PDFs | Supabase Storage |
| Images | Supabase Storage |
| Lesson videos | Supabase Storage or external video provider |
| File access control | Storage policies + RLS |
| Realtime notifications | Supabase Realtime |
| AI API keys | Edge Functions |
| AI tutor | Edge Functions |
| AI quiz generation | Edge Functions |
| AI explanations | Edge Functions |
| Payment secrets | Edge Functions |
| Payment webhooks | Edge Functions |
| Scheduled processing | Edge Functions / external job service when needed |
| Complex long-running processing | Separate worker service only when necessary |
| Public website hosting | Vercel |
| Mobile application | Flutter/React Native |
| Admin application | Next.js |
| Search | PostgreSQL initially; dedicated search later if scale requires it |

---

# 4. Final System Architecture

```text
                                THE GUIDE
                                    |
       +----------------------------+----------------------------+
       |                            |                            |
       v                            v                            v
   WEB APP                      MOBILE APP                  ADMIN APP
  Next.js/Vercel              Flutter/React Native         Next.js/Vercel
       |                            |                            |
       +----------------------------+----------------------------+
                                    |
                            SUPABASE PLATFORM
                                    |
         +--------------------------+--------------------------+
         |                          |                          |
         v                          v                          v
    SUPABASE AUTH             POSTGRESQL DATABASE        SUPABASE STORAGE
         |                          |                          |
         |                          |                          |
   Authentication              RLS Policies              PDFs/Images
   Sessions                    Functions                 Documents
   OAuth                       Triggers                  Media
   Recovery                    Views
                                    |
                                    v
                          SUPABASE EDGE FUNCTIONS
                                    |
              +---------------------+----------------------+
              |                     |                      |
              v                     v                      v
         AI PROVIDER          PAYMENT PROVIDER       OTHER SERVICES
         Bynara/OpenAI        Flutterwave/Paystack   Email/SMS/etc.
```

---

# 5. Frontend Architecture

## 5.1 Web

Use:

```text
Next.js
  |
  +-- Vercel
  |
  +-- Supabase client
```

The web application should communicate with Supabase directly for normal authenticated CRUD operations.

Example:

```text
Student
   |
   v
Next.js
   |
   v
Supabase Auth
   |
   v
PostgreSQL + RLS
```

The frontend does **not** receive privileged secrets.

### Frontend environment variables

Safe client-side variables:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Never expose:

```env
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_PASSWORD=...
JWT_SECRET=...
AI_API_KEY=...
PAYMENT_SECRET_KEY=...
```

---

# 6. Mobile Architecture

The mobile app should use the same backend services and educational data as the website.

```text
Flutter / React Native
          |
          +---- Supabase Auth
          |
          +---- Supabase Database
          |
          +---- Supabase Storage
          |
          +---- Edge Functions
```

This means:

```text
Web student
    |
    +--> Same account
    |
    +--> Same courses
    |
    +--> Same progress
    |
    +--> Same exam history
    |
    +--> Same subscriptions

Mobile student
```

There should be **one source of truth** for educational data.

---

# 7. Authentication Architecture

## Use Supabase Auth

The previous custom JWT system should be phased out.

Recommended flow:

```text
Student
   |
   v
Supabase Auth
   |
   v
Authenticated user session
   |
   v
auth.uid()
   |
   v
PostgreSQL RLS
```

Supabase Auth should handle:

- Email/password
- Password recovery
- Email verification
- OAuth providers when needed
- Session refresh
- Secure authentication tokens
- MFA if eventually enabled

The application database stores the user's educational profile separately.

Example:

```text
auth.users
     |
     | 1:1
     v
profiles
     |
     +--> role
     +--> education_level
     +--> class/program
     +--> preferences
```

---

# 8. Authorization Architecture

Use a combination of:

```text
Supabase Auth
       +
PostgreSQL Row Level Security
       +
Application roles
```

Example roles:

```text
student
parent
teacher
school_admin
content_editor
content_admin
finance_admin
super_admin
```

Do not rely only on frontend checks such as:

```javascript
if (user.role === "admin") {
  showAdminPanel();
}
```

The database itself must enforce access.

---

# 9. Row Level Security

RLS becomes a core security boundary.

Example:

```sql
create policy "Students can read own progress"
on student_progress
for select
to authenticated
using (user_id = auth.uid());
```

Example:

```sql
create policy "Students can update own progress"
on student_progress
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
```

Administrative operations should use properly protected server-side functions where needed.

Do not place service-role credentials in the browser.

---

# 10. Database Architecture

Use one central Supabase PostgreSQL database.

### Core identity tables

```text
profiles
user_roles
parent_children
teachers
schools
school_members
```

### Education structure

```text
education_levels
programs
classes
terms
semesters
subjects
topics
subtopics
curriculum
```

### Learning content

```text
courses
course_sections
lessons
lesson_resources
library_resources
documents
videos
images
```

### Assessments

```text
questions
question_options
question_topics
quizzes
quiz_questions
exams
exam_questions
exam_attempts
exam_answers
exam_results
assignments
submissions
grades
```

### Progress

```text
student_courses
student_progress
lesson_progress
study_sessions
weak_topics
```

### AI

```text
ai_conversations
ai_messages
ai_usage
ai_feedback
```

### Commerce

```text
subscription_plans
subscriptions
payments
transactions
invoices
```

### Engagement

```text
notifications
flashcards
flashcard_reviews
badges
achievements
student_points
leaderboards
```

### Community

```text
study_groups
group_members
discussion_threads
discussion_posts
comments
reports
```

### Administration

```text
audit_logs
content_reviews
content_versions
system_settings
```

---

# 11. Curriculum Architecture

The platform must support the entire educational ecosystem without hard-coding one level.

```text
Education Level
      |
      v
Class / Program
      |
      v
Subject
      |
      v
Term / Semester
      |
      v
Topic
      |
      v
Subtopic
      |
      v
Lesson
      |
      v
Resources
      |
      v
Assessment
```

Example:

```text
SS 2
 |
 +-- Biology
      |
      +-- First Term
           |
           +-- Cell Biology
                |
                +-- Cell Structure
                |    +-- Lesson
                |    +-- Notes
                |    +-- Video
                |    +-- Quiz
                |
                +-- Cell Division
                     +-- Lesson
                     +-- Notes
                     +-- Quiz
```

---

# 12. Content Architecture

Every lesson should support multiple learning formats.

```text
Lesson
 |
 +-- Title
 +-- Description
 +-- Learning Objectives
 +-- Written Content
 +-- Video
 +-- Images
 +-- Diagrams
 +-- PDF
 +-- Examples
 +-- Key Points
 +-- Practice Questions
 +-- Quiz
 +-- Related Lessons
```

This keeps THE GUIDE from becoming just a video website.

---

# 13. Past Questions Architecture

Past questions should be first-class educational data.

```text
Exam
 |
 +-- Year
 +-- Subject
 +-- Topic
 +-- Question
 +-- Options
 +-- Correct Answer
 +-- Explanation
 +-- Difficulty
 +-- Source
```

Support:

```text
WAEC
NECO
JAMB
NABTEB
Post-UTME
University exams
Professional exams
Custom exams
```

Past-question content should be stored and indexed so that the assessment engine and AI system can reuse it.

---

# 14. Assessment Engine

The assessment engine should be implemented as reusable database logic plus application logic.

```text
Assessment Engine
 |
 +-- Question Bank
 +-- Random Selection
 +-- Difficulty Selection
 +-- Topic Selection
 +-- Timer
 +-- Auto Marking
 +-- Manual Marking
 +-- Results
 +-- Analytics
 +-- Recommendations
```

Example:

```text
Biology
   |
Genetics
   |
20 questions
   |
Medium difficulty
   |
Start exam
```

The resulting attempt is stored centrally in PostgreSQL.

---

# 15. Progress System

Track educational progress centrally.

```text
Student Progress
 |
 +-- Courses completed
 +-- Lessons completed
 +-- Quiz scores
 +-- Exam scores
 +-- Study time
 +-- Questions attempted
 +-- Correct answers
 +-- Weak topics
 +-- Strong topics
 +-- Streak
 +-- Overall performance
```

This data powers:

- Dashboards
- Recommendations
- AI tutoring
- Parent reports
- Teacher analytics
- Gamification

---

# 16. AI Architecture

AI should **not** be called directly from the browser when an API secret is required.

Use:

```text
Student
   |
   v
Web / Mobile
   |
   v
Supabase Edge Function
   |
   +--> Authenticate user
   +--> Check permissions
   +--> Check subscription/usage
   +--> Load relevant educational context
   |
   v
AI Provider
   |
   v
Edge Function
   |
   v
Store response in Supabase
   |
   v
Frontend
```

AI services:

```text
AI Tutor
Question Explainer
Quiz Generator
Study Plan Generator
Summary Generator
Flashcard Generator
Revision Assistant
Personalized Recommendations
```

---

# 17. AI Tutor Context

The AI should be given structured educational context.

```text
Student Level
      +
Current Subject
      +
Current Topic
      +
Current Lesson
      +
Learning History
      +
Relevant Curriculum Content
      +
Previous Conversation
```

Later, a RAG layer can retrieve relevant approved educational content:

```text
Student Question
      |
      v
Search educational knowledge
      |
      v
Relevant content
      |
      v
AI model
      |
      v
Answer
```

---

# 18. Payment Architecture

Payments should use Edge Functions for secrets and webhooks.

```text
Frontend
   |
   v
Edge Function
   |
   v
Payment Provider
   |
   v
Webhook
   |
   v
Edge Function
   |
   v
Verify transaction
   |
   v
Update subscriptions/payments
```

The frontend must never contain:

```text
PAYMENT_SECRET_KEY
```

Supported providers can sit behind an internal payment abstraction.

Example:

```text
PaymentService
 |
 +-- Flutterwave
 +-- Paystack
 +-- Future Provider
```

---

# 19. Storage Architecture

Use Supabase Storage for the platform's file assets.

```text
Storage
 |
 +-- course-materials
 +-- lesson-pdfs
 +-- images
 +-- question-images
 +-- certificates
 +-- user-uploads
```

Store metadata in PostgreSQL:

```text
lesson_resources
document metadata
file path
mime type
size
owner
visibility
```

Do not store large PDFs or videos directly inside PostgreSQL rows.

---

# 20. Admin Architecture

The admin interface should be a separate application or clearly isolated admin area.

Recommended:

```text
admin/
 |
 +-- Dashboard
 +-- Users
 +-- Teachers
 +-- Schools
 +-- Curriculum
 +-- Courses
 +-- Lessons
 +-- Questions
 +-- Exams
 +-- Library
 +-- AI
 +-- Payments
 +-- Subscriptions
 +-- Reports
 +-- Moderation
 +-- Settings
```

Admins should use the same Supabase Auth system with elevated roles enforced server-side and by database policy.

---

# 21. Content Management Workflow

Use a publishing workflow:

```text
Draft
  |
  v
Review
  |
  v
Approved
  |
  v
Published
  |
  v
Archived
```

For example:

```text
Teacher creates lesson
        |
        v
Draft
        |
        v
Editor reviews
        |
        v
Admin approves
        |
        v
Published
```

This is essential when THE GUIDE eventually has large amounts of educational content.

---

# 22. Search Architecture

Start with PostgreSQL search.

Search across:

```text
Courses
Lessons
Subjects
Topics
Questions
Teachers
PDFs
Past Questions
Videos
```

Example:

```text
"Photosynthesis"
       |
       +-- Courses
       +-- Lessons
       +-- Notes
       +-- Past Questions
       +-- Quizzes
       +-- Flashcards
       +-- AI explanations
```

Introduce a dedicated search engine only when the scale actually requires it.

---

# 23. Realtime Features

Use Supabase Realtime where appropriate.

Examples:

```text
Realtime
 |
 +-- Notifications
 +-- Live class presence
 +-- Discussion updates
 +-- Teacher announcements
 +-- Progress updates
```

Do not build a custom websocket server unless there is a demonstrated requirement for one.

---

# 24. Web Deployment

Use:

```text
Next.js
   |
   v
Vercel
```

Production web environment:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

No database passwords or service keys belong here.

---

# 25. Supabase Deployment

Supabase is the backend platform.

Production services:

```text
Supabase
 |
 +-- Auth
 +-- Database
 +-- Storage
 +-- RLS
 +-- Realtime
 +-- Edge Functions
```

Keep database migrations in the repository:

```text
supabase/
 |
 +-- migrations/
 +-- seed/
 +-- functions/
```

The database schema should be reproducible from version-controlled migrations.

---

# 26. Edge Functions Structure

Recommended:

```text
supabase/functions/
 |
 +-- ai-tutor/
 +-- ai-explain/
 +-- ai-quiz-generator/
 +-- create-payment/
 +-- payment-webhook/
 +-- send-notification/
 +-- generate-certificate/
 +-- admin-actions/
```

Each function should:

1. Validate the request.
2. Authenticate the user when required.
3. Check authorization.
4. Validate input.
5. Execute protected logic.
6. Return a safe response.
7. Log important failures without exposing secrets.

---

# 27. When a Separate Backend IS Needed

Do not eliminate a custom backend forever.

Introduce one only when there is a real requirement such as:

```text
Large background processing
Very long-running jobs
High-compute workloads
Specialized media processing
Complex external integrations
Dedicated worker architecture
Advanced queue processing
Machine learning infrastructure
```

Then the architecture becomes:

```text
Frontend
   |
Supabase
   |
Edge Functions
   |
   +---- normal application logic
   |
   +---- Custom Worker Service
            |
            +---- heavy processing
            +---- queues
            +---- specialized jobs
```

The key difference is that the custom backend is **an additional specialized service**, not the default backend for everything.

---

# 28. What to Do With the Existing Express Backend

Do not delete it immediately.

First classify its existing modules.

### Candidate for removal/migration

```text
Custom Auth
Custom JWT
Basic CRUD APIs
User sessions
Simple profile APIs
Simple course queries
Simple progress queries
Basic storage routes
```

These can often move to Supabase Auth, RLS and normal database access.

### Candidate to remain as Edge Functions

```text
AI
Payments
Webhooks
Sensitive server-side logic
Admin operations requiring privileged access
```

### Candidate for a future worker service

```text
Heavy document processing
Large-scale ingestion
Long-running jobs
Queue workers
Complex media processing
```

---

# 29. Migration Strategy

Do not attempt a destructive rewrite.

### Phase A — Secure the existing system

- Rotate exposed credentials.
- Remove secrets from Git.
- Protect service-role keys.
- Verify database access.
- Verify payment secrets.
- Verify storage policies.

### Phase B — Adopt Supabase Auth

Move from:

```text
Custom users + custom JWT
```

to:

```text
Supabase Auth + profiles + RLS
```

### Phase C — Move normal CRUD to Supabase

Gradually replace endpoints for:

```text
profiles
courses
lessons
subjects
topics
questions
progress
```

with direct Supabase queries protected by RLS.

### Phase D — Move protected server logic to Edge Functions

Move:

```text
AI
Payments
Webhooks
Sensitive admin operations
```

### Phase E — Remove unnecessary Express modules

After each feature is verified in production, remove the duplicated custom backend implementation.

---

# 30. Recommended Repository Structure

```text
the-guide/
 |
 +-- web/
 |    +-- src/
 |    +-- public/
 |    +-- package.json
 |
 +-- mobile/
 |    +-- lib/
 |    +-- pubspec.yaml
 |
 +-- admin/
 |    +-- src/
 |    +-- package.json
 |
 +-- supabase/
 |    +-- migrations/
 |    +-- functions/
 |    +-- seed/
 |    +-- config.toml
 |
 +-- scripts/
 |    +-- import-content/
 |    +-- process-questions/
 |    +-- seed-curriculum/
 |
 +-- docs/
 |    +-- architecture.md
 |    +-- database.md
 |    +-- security.md
 |
 +-- package.json
 +-- README.md
 +-- .gitignore
```

A large custom `backend/` directory is **not required initially**.

---

# 31. Frontend Feature Structure

```text
web/src/
 |
 +-- app/
 +-- components/
 +-- features/
 |    +-- auth/
 |    +-- onboarding/
 |    +-- home/
 |    +-- courses/
 |    +-- lessons/
 |    +-- exams/
 |    +-- questions/
 |    +-- library/
 |    +-- ai/
 |    +-- progress/
 |    +-- subscriptions/
 |    +-- notifications/
 |    +-- profile/
 |    +-- community/
 |
 +-- lib/
 |    +-- supabase/
 |    +-- auth/
 |    +-- api/
 |
 +-- hooks/
 +-- state/
 +-- types/
 +-- utils/
```

---

# 32. Mobile Feature Structure

```text
mobile/lib/
 |
 +-- core/
 |    +-- config/
 |    +-- security/
 |    +-- network/
 |    +-- storage/
 |
 +-- features/
 |    +-- authentication/
 |    +-- onboarding/
 |    +-- home/
 |    +-- courses/
 |    +-- lessons/
 |    +-- exams/
 |    +-- library/
 |    +-- progress/
 |    +-- ai_tutor/
 |    +-- notifications/
 |    +-- subscriptions/
 |    +-- profile/
 |
 +-- shared/
 +-- main.dart
```

---

# 33. Security Architecture

```text
Security
 |
 +-- Supabase Auth
 +-- RLS
 +-- Role permissions
 +-- Input validation
 +-- Edge Function authorization
 +-- Rate limiting
 +-- Storage policies
 +-- Payment verification
 +-- Audit logs
 +-- Secret management
 +-- Account recovery
```

Important rule:

> **The frontend is never a security boundary.**

A user must not gain access merely because a frontend button is hidden.

---

# 34. Secret Management

Secrets belong only in server-side environments.

### Browser-safe

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Server-only

```env
SUPABASE_SERVICE_ROLE_KEY
DATABASE_PASSWORD
AI_API_KEY
PAYMENT_SECRET_KEY
JWT_SECRET
WEBHOOK_SECRET
```

Do not commit secret values.

Do not place server-only variables in:

```text
web/.env.*
public/
client-side JavaScript
mobile source code
Git history
```

---

# 35. Development Environment

A simple local development setup should be possible.

```text
Web:
localhost:3000

Supabase:
local Supabase CLI stack
OR
development Supabase project
```

The old requirement that a Node backend must start before the frontend is no longer fundamental.

Development becomes:

```text
npm run dev
        |
        +--> Next.js
        |
        +--> Supabase
```

When Edge Functions are needed, run them through the Supabase local development workflow.

---

# 36. Production Data Flow

## Normal data request

```text
Student
   |
   v
Next.js
   |
   v
Supabase
   |
   +--> Auth
   +--> PostgreSQL
   +--> RLS
   |
   v
Response
```

## AI request

```text
Student
   |
   v
Next.js
   |
   v
Edge Function
   |
   +--> Auth check
   +--> Usage check
   +--> Read educational context
   |
   v
AI Provider
   |
   v
Edge Function
   |
   v
Supabase Database
   |
   v
Student
```

## Payment request

```text
Student
   |
   v
Next.js
   |
   v
Edge Function
   |
   v
Payment Provider
   |
   v
Webhook
   |
   v
Edge Function
   |
   v
Supabase
```

---

# 37. Why This Architecture Is Better for THE GUIDE

The new architecture reduces unnecessary infrastructure.

### Previous architecture

```text
Frontend
   |
Custom API
   |
Custom Auth
   |
PostgreSQL
   |
Storage
   |
Redis
   |
Queue
   |
Supabase
```

This creates more code, more deployment points and more opportunities for configuration failures.

### New architecture

```text
Frontend
    |
Supabase
    |
+---+-----------------+
|   |   |   |         |
DB Auth Storage RLS Realtime
    |
Edge Functions
    |
AI / Payments / Protected Logic
```

Benefits:

- Smaller codebase
- Less infrastructure to maintain
- Fewer deployment problems
- Built-in authentication
- Built-in database
- Built-in RLS
- Built-in storage
- Easier mobile/web sharing
- Easier scaling
- Lower initial operational complexity
- Faster development

---

# 38. What Should NOT Be Built Yet

Do not add infrastructure just because the roadmap mentions it.

Avoid initially building:

```text
Custom Redis infrastructure
Custom websocket server
BullMQ cluster
Custom authentication
Custom JWT system
Dedicated search engine
Microservices
Kubernetes
Complex event bus
Separate database per feature
```

Build these only when measurable requirements justify them.

---

# 39. MVP Architecture

For the first production version, use only:

```text
                    THE GUIDE MVP

             +-----------------------+
             |   Next.js Web App     |
             |        Vercel         |
             +-----------+-----------+
                         |
                         v
               +-------------------+
               |     Supabase      |
               +-------------------+
               | Auth              |
               | PostgreSQL        |
               | RLS               |
               | Storage           |
               | Realtime          |
               +---------+---------+
                         |
                         v
                Supabase Functions
                         |
                 +-------+-------+
                 |               |
                 v               v
                AI          Payments
```

This is enough for:

- Registration
- Login
- Profiles
- Classes
- Subjects
- Courses
- Lessons
- PDFs
- Questions
- Quizzes
- Exams
- Past questions
- Progress
- AI tutor
- Subscriptions
- Payments
- Admin content management

---

# 40. Development Phases

## Phase 1 — Foundation

Build:

```text
Supabase project
Database schema
Supabase Auth
Profiles
Education levels
Classes/programs
Subjects
Curriculum
RLS
Admin foundation
```

## Phase 2 — Core Learning

Build:

```text
Courses
Lessons
Videos
Notes
PDFs
Resources
Progress
Search
```

## Phase 3 — Assessment

Build:

```text
Question bank
Question options
Quizzes
Past questions
Mock exams
Exam attempts
Results
Analytics
```

## Phase 4 — Monetization

Build:

```text
Plans
Subscriptions
Payments
Payment webhooks
Premium content
```

## Phase 5 — AI

Build:

```text
AI Tutor
AI explanations
Quiz generation
Study plans
Summaries
Flashcards
Recommendations
```

## Phase 6 — Ecosystem

Build:

```text
Parents
Teachers
Schools
Community
Live classes
Gamification
Certificates
```

## Phase 7 — Scale

Only when required:

```text
Dedicated search
Background workers
Heavy processing infrastructure
Advanced analytics
Additional services
```

---

# 41. Immediate Changes to the Current Project

The current project should be changed from:

```text
web/
backend/
Supabase
```

to:

```text
web/
supabase/
admin/
mobile/
scripts/
docs/
```

The existing `backend/` should be treated as a **migration source**, not automatically as the permanent architecture.

The first implementation tasks should be:

1. Audit the current Express routes.
2. Map every route to one of:
   - Supabase direct query
   - Supabase Auth
   - RLS policy
   - Edge Function
   - Future worker
   - Still-required custom service
3. Introduce Supabase Auth.
4. Rebuild database authorization around `auth.uid()`.
5. Remove the custom JWT authentication flow.
6. Move AI and payments into Edge Functions.
7. Migrate simple CRUD features away from Express.
8. Delete duplicated backend code only after the replacements are tested.

---

# 42. Final Architecture

```text
                                THE GUIDE
                                   |
        +--------------------------+--------------------------+
        |                          |                          |
        v                          v                          v
      WEB                       MOBILE                      ADMIN
    Next.js                     Flutter                    Next.js
    Vercel                                                    Vercel
        |                          |                          |
        +--------------------------+--------------------------+
                                   |
                                   v
                         +---------------------+
                         |      SUPABASE       |
                         +---------------------+
                         |                     |
                  +------+------+       +------+------+
                  |             |       |             |
                  v             v       v             v
               AUTH         DATABASE  STORAGE      REALTIME
                              |
                              v
                         RLS POLICIES
                              |
                              v
                       EDGE FUNCTIONS
                              |
              +---------------+----------------+
              |               |                |
              v               v                v
             AI           PAYMENTS       PROTECTED LOGIC
              |               |
              +---------------+
                      |
                      v
                 External APIs

                  Optional later:
                      |
                      v
                Worker Services
```

---

# 43. Final Rule for the Project

> **Use Supabase as the backend platform, not merely as a database.**

The frontend should use Supabase directly for normal authenticated data operations.

Edge Functions should be used for secrets, AI, payments, webhooks and other protected server-side logic.

A separate Node/Express backend should only be introduced when a requirement exists that Supabase cannot reasonably handle.

This architecture keeps THE GUIDE simple enough to build now while preserving a path to a very large educational ecosystem later.
