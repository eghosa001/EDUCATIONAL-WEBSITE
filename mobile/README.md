# Mobile Application - Flutter

## Structure
```
lib/
├── core/                   # App-wide configuration & utilities
│   ├── config/             # Environment config
│   ├── constants/          # App constants
│   ├── errors/             # Error handling
│   ├── network/            # Dio/HTTP client
│   ├── storage/            # Local storage (Hive/SharedPreferences)
│   ├── security/           # Encryption, biometrics
│   ├── theme/              # Light/dark themes
│   ├── utils/              # Helpers
│   └── localization/       # i18n
├── features/               # Feature modules (clean architecture)
│   ├── authentication/
│   ├── onboarding/
│   ├── home/
│   ├── courses/
│   ├── lessons/
│   ├── exams/
│   ├── questions/
│   ├── library/
│   ├── progress/
│   ├── flashcards/
│   ├── ai_tutor/
│   ├── notifications/
│   ├── profile/
│   ├── subscriptions/
│   ├── community/
│   ├── parent/
│   ├── teacher/
│   └── school/
├── shared/                 # Shared across features
│   ├── widgets/            # Reusable widgets
│   ├── models/             # Data models
│   ├── services/           # Shared services
│   ├── repositories/       # Data repositories
│   ├── providers/          # Riverpod providers
│   └── blocs/              # BLoC/Cubit state management
├── routing/                # GoRouter configuration
├── di/                     # Dependency injection (get_it)
��── main.dart               # Entry point
```