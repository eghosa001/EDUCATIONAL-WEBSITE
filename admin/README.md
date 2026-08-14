# Admin Panel - Platform Management

## Structure
```
src/
├── app/                    # Main entry & routing
├── components/             # Admin-specific UI components
│   ├── ui/                 # Base components
│   ├── forms/              # Complex admin forms
│   ├── tables/             # Data tables with sorting/filtering
│   ├── charts/             # Analytics charts
│   ├── layout/             # Sidebar, Header, Breadcrumbs
│   └── feedback/           # Toasts, Modals, Confirmations
├── pages/                  # Admin pages by domain
│   ├── dashboard/          # Overview, metrics
│   ├── users/              # Student, Parent, Teacher, School management
│   ├── teachers/           # Teacher verification, analytics
│   ├── schools/            # School onboarding, management
│   ├── curriculum/         # Levels, Classes, Subjects, Topics
│   ├── courses/            # Course approval, management
│   ├── lessons/            # Lesson content management
│   ├── questions/          # Question bank management
│   ├── exams/              # Exam configuration
│   ├── library/            # Library content management
│   ├── ai/                 # AI configuration, monitoring
│   ├── payments/           # Transaction management
│   ├── subscriptions/      # Plan management
│   ├── reports/            # Platform reports
│   ├── moderation/         # Content moderation
│   ├── content-approval/   # Review workflow
│   └── settings/           # System configuration
├── features/               # Feature-specific logic
├── services/               # Admin services
├── hooks/                  # Custom hooks
├── utils/                  # Helpers, formatters
├── types/                  # TypeScript types
��── styles/                 # Admin theme
```