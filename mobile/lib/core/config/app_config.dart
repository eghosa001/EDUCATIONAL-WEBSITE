class AppConfig {
  static const String appName = 'EduPlatform';
  static const String appVersion = '1.0.0';
  static const String apiBaseUrl = 'http://localhost:3000/api/v1';
  static const String websocketUrl = 'http://localhost:3001';
  static const int apiTimeoutSeconds = 30;

  // Feature flags
  static const bool enableAnalytics = true;
  static const bool enableCrashReporting = true;
  static const bool enableNotifications = true;

  // Storage keys
  static const String tokenKey = 'auth_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user_data';
  static const String themeKey = 'app_theme';
  static const String languageKey = 'app_language';

  // Hive boxes
  static const String authBoxName = 'auth_box';
  static const String settingsBoxName = 'settings_box';
  static const String cacheBoxName = 'cache_box';

  // Firebase
  static const String firebaseProjectId = 'edu-platform';
  static const String fcmSenderId = '';
}
