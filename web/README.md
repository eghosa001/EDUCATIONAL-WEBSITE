# Web Application - Student/Teacher/Parent Portal

## Structure
```
src/
├── app/                    # Next.js App Router / Main entry
├── components/             # Reusable UI components
│   ├── ui/                 # Base UI components (Button, Input, Card, etc.)
│   ├── forms/              # Form components
│   ├── layout/             # Layout components (Header, Footer, Sidebar)
│   ├── feedback/           # Toast, Modal, Alert, Progress
│   ├── data-display/       # Tables, Charts, Lists, Badges
│   └── navigation/         # Tabs, Breadcrumbs, Pagination
├── layouts/                # Page layouts (Auth, Dashboard, Public)
├── pages/                  # Page components by feature
│   ├── auth/               # Login, Register, Password reset
│   ├── home/               # Landing, Dashboard
│   ├── courses/            # Course browsing, details
│   ├── lessons/            # Lesson viewer, player
│   ├── exams/              # Exam taking, results
│   ├── library/            # Digital library
│   ├── ai/                 # AI tutor chat
│   ├── subscriptions/      # Plans, billing
│   ├── profile/            # User profile, settings
│   ├── parent/             # Parent dashboard
│   ├── teacher/            # Teacher dashboard
│   └── school/             # School portal
├── features/               # Feature-specific logic (hooks, components, utils)
├── services/               # Business logic services
├── api/                    # API client & endpoints
├── state/                  # Global state (Zustand/Redux)
├── hooks/                  # Custom React hooks
├── utils/                  # Helpers, formatters, validators
├── types/                  # TypeScript types
��── styles/                 # Tailwind/CSS modules
```