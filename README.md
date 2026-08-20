# THE GUIDE

Your path to smarter learning. A comprehensive educational platform covering primary school through university/professional learning for Nigeria.

## Architecture Overview

```
THE GUIDE
         │
��────────��────────��
│        │        │
WEB     MOBILE   ADMIN
APP      APP     PANEL
│        │        │
��────────��────────��
         │
      API BACKEND
         │
��────────��────────��
│        │        │
DB      STORAGE   AUTH
```

**One backend + one database + shared educational content system + web app + mobile app + admin platform.**

## Project Structure

```
educational-platform/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── auth/           # Authentication & authorization
│   │   ├── users/          # User management
│   │   ├── education/      # Education systems, levels, programs, classes
│   │   ├── curriculum/     # Subjects, topics, subtopics
│   │   ├── courses/        # Course management
│   │   ├── lessons/        # Lesson content & resources
│   │   ├── assessments/    # Assessment engine
│   │   ├── questions/      # Question bank
│   │   ├── exams/          # Examination system
│   │   ├── assignments/    # Assignment management
│   │   ├── progress/       # Student progress tracking
│   │   ├── library/        # Digital library
│   │   ├── teachers/       # Teacher dashboard & earnings
│   │   ├── parents/        # Parent dashboard
│   │   ├── schools/        # School management
│   │   ├── subscriptions/  # Subscription plans
│   │   ├── payments/       # Payment processing
│   │   ├── notifications/  # Notification service
│   │   ├── ai/             # AI education engine (Bynara)
│   │   ├── gamification/   # XP, badges, streaks
│   │   ├── community/      # Forums, study groups
│   │   ├── search/         # Global search
│   │   ├── analytics/      # Platform analytics
│   │   ├── reports/        # Reporting system
│   │   ├── storage/        # File storage abstraction
│   │   ├── administration/ # Admin-only operations
│   │   ├── common/         # Shared utilities
│   │   │   ├── middleware/
│   │   │   ├── utils/
│   │   │   ├── validators/
│   │   │   ├── errors/
│   │   │   ├── constants/
│   │   │   ├── config/
│   │   │   ├── database/
│   │   │   ├── queue/
│   │   │   ├── cache/
│   │   │   └── events/
│   │   └── routes/         # API route definitions
│   ├── scripts/            # Database migrations, seeds
│   ├── tests/
│   ├── config/
│   └── docs/
├── web/                     # Next.js Web Application
│   ├── public/
│   └── src/
│       ├── app/            # Next.js App Router
│       ├── components/     # Reusable UI components
│       ├── layouts/        # Page layouts
│       ├── pages/          # Page components by feature
│       ├── features/       # Feature-specific logic
│       ├── services/       # Business logic services
│       ├── api/            # API client & endpoints
│       ├── state/          # Global state (Zustand)
│       ├── hooks/          # Custom React hooks
│       ├── utils/          # Helpers, formatters, validators
│       ├── types/          # TypeScript types
│       └── styles/         # Tailwind CSS
├── admin/                   # Next.js Admin Panel
│   ├── public/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── pages/
│       ├── features/
│       ├── services/
│       ├── hooks/
│       ├── utils/
│       ├── types/
│       └── styles/
├── mobile/                  # Flutter Mobile App
│   ├── lib/
│   │   ├── core/           # App-wide configuration
│   │   ├── features/       # Feature modules (clean architecture)
│   │   ├── shared/         # Shared across features
│   │   ├── routing/        # GoRouter configuration
│   │   └── di/             # Dependency injection
│   ├── test/
│   └── assets/
├── shared/                  # Shared types & config
│   ├── types/
│   ├── config/
│   ├── constants/
│   ├── utils/
│   └── schemas/
├── docker-compose.yml       # Local development services
├── package.json             # Root workspace config
��── turbo.json              # Turborepo config
```

## User Types

| Role | Description |
|------|-------------|
| **Student** | Learn, take exams, track progress, AI tutor |
| **Parent** | Monitor children, view results, pay subscriptions |
| **Teacher** | Create courses, upload content, mark assignments |
| **School** | Manage students, teachers, classes, exams |
| **Content Admin** | Manage curriculum, approve content |
| **Super Admin** | Full platform control |

## Education Structure (Nigerian System)

```
Education System: Nigerian
├── Early Years
├── Primary (Primary 1-6)
├── Junior Secondary (JSS 1-3)
├── Senior Secondary (SS 1-3)
├── Tertiary (University, Polytechnic, College of Education)
├── Professional (Certification, Professional Exams, Career Training)
��── Adult/Vocational Learning
```

## Curriculum Hierarchy

```
Education Level → Class/Program → Subject → Term/Semester → Topic → Subtopic → Lesson → Materials → Assessment
```

## Key Features

### Phase 1 - Foundation ��
- [x] Authentication (JWT, refresh tokens, email verification)
- [x] User management (roles, permissions)
- [x] Education structure (systems, levels, programs, classes, terms)
- [x] Database schema (PostgreSQL)
- [x] API structure with validation

### Phase 2 - Core Learning (Next)
- [ ] Courses & course sections
- [ ] Lessons (video, text, PDF, interactive)
- [ ] Lesson resources (downloads, notes)
- [ ] Student progress tracking
- [ ] Search & discovery

### Phase 3 - Examination System
- [ ] Question bank (MCQ, true/false, fill-blank, essay, etc.)
- [ ] Quizzes & practice tests
- [ ] Past questions (WAEC, NECO, JAMB, NABTEB, Post-UTME)
- [ ] Mock examinations
- [ ] Auto-grading & analytics

### Phase 4 - Monetization
- [ ] Subscription plans (Free, Basic, Premium, Parent, Teacher, School)
- [ ] Payment integration (Flutterwave, Paystack, Stripe)
- [ ] Individual course sales
- [ ] Teacher revenue sharing

### Phase 5 - AI Education Engine
- [ ] AI Tutor (context-aware)
- [ ] Question explainer
- [ ] Quiz generator
- [ ] Study plan generator
- [ ] Personalized recommendations
- [ ] RAG with curriculum content

### Phase 6 - Ecosystem
- [ ] Parent dashboard
- [ ] Teacher dashboard
- [ ] School management
- [ ] Live classes
- [ ] Community/forums
- [ ] Gamification (XP, badges, streaks)
- [ ] Certificates

### Phase 7 - Scale
- [ ] Advanced analytics
- [ ] Multi-country support
- [ ] Multi-language
- [ ] Corporate training
- [ ] Marketplace

## Technology Stack

### Backend
- **Runtime**: Node.js 20+ (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Storage**: MinIO (S3-compatible)
- **Auth**: JWT with refresh tokens
- **Validation**: Joi/Zod
- **Queue**: BullMQ
- **AI**: Bynara API (OpenAI-compatible)
- **Payments**: Flutterwave, Paystack, Stripe
- **Email**: Nodemailer (SMTP)
- **SMS**: Twilio

### Web (Next.js 14)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **UI**: Radix UI + Tailwind CSS
- **Charts**: Recharts
- **Video**: React Player
- **PDF**: PDF.js

### Admin (Next.js 14)
- Same stack as web
- **Tables**: TanStack Table
- **Export**: xlsx, file-saver

### Mobile (Flutter 3.22+)
- **State**: Riverpod
- **Routing**: GoRouter
- **DI**: GetIt + Injectable
- **Networking**: Dio + Retrofit
- **Storage**: Hive + Flutter Secure Storage
- **Video**: Chewie + Video Player
- **PDF**: pdfx + printing
- **Notifications**: Firebase Messaging
- **Analytics**: Firebase Analytics + Crashlytics

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Redis 7
- MinIO (or S3-compatible)
- Flutter 3.22+ (for mobile)

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

### Web App Setup

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

### Admin Panel Setup

```bash
cd admin
cp .env.example .env.local
npm install
npm run dev
```

### Mobile App Setup

```bash
cd mobile
flutter pub get
flutter run
```

### Docker Development

```bash
docker-compose up -d
# Starts PostgreSQL, Redis, MinIO, Mailhog
```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=educational_platform
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=educational-platform
BYNARA_API_KEY=your-bynara-key
FLUTTERWAVE_PUBLIC_KEY=your-key
FLUTTERWAVE_SECRET_KEY=your-key
PAYSTACK_PUBLIC_KEY=your-key
PAYSTACK_SECRET_KEY=your-key
```

### Web/Admin (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## API Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

GET    /api/v1/education/systems
POST   /api/v1/education/systems
GET    /api/v1/education/systems/:id/levels
POST   /api/v1/education/systems/:id/levels
GET    /api/v1/education/levels/:id/programs
POST   /api/v1/education/levels/:id/programs
GET    /api/v1/education/programs/:id/classes
POST   /api/v1/education/programs/:id/classes
GET    /api/v1/education/terms
POST   /api/v1/education/terms

GET    /api/v1/users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id/profile
GET    /api/v1/users/:id/courses
GET    /api/v1/users/:id/progress
GET    /api/v1/users/:id/achievements
```

## Demo Accounts

After running `npm run db:seed` and `npm run db:seed-ecosystem`, use these credentials to test the platform:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@learnforge.ng | Admin@12345 |
| Teacher | teacher@learnforge.ng | Teacher@12345 |
| Student | student@learnforge.ng | Student@12345 |
| Parent | mr.johnson@example.com | Parent@1234! |
| Parent | mrs.okafor@example.com | Parent@1234! |
| Parent | dr.abubakar@example.com | Parent@1234! |

## Database Schema

Key tables:
- `users` - All platform users
- `roles` / `user_roles` - RBAC
- `education_systems` - Nigerian, British, etc.
- `education_levels` - Primary, Secondary, Tertiary
- `programs` - Specific programs within levels
- `classes` - Individual classes (e.g., "Primary 1", "SS 2")
- `terms` - Academic terms/semesters
- `subjects` - Subjects per education system
- `topics` / `subtopics` - Curriculum hierarchy
- `courses` / `course_sections` - Course structure
- `lessons` / `lesson_resources` - Lesson content
- `student_courses` / `lesson_progress` - Progress tracking
- `questions` / `quizzes` / `exams` - Assessment
- `exam_attempts` / `exam_answers` - Results
- `assignments` / `submissions` - Assignments

## Contributing

1. Follow the existing code patterns
2. Use feature-based folder structure
3. Write tests for new features
4. Update documentation
5. Run linting and type checking

## License

ISC License