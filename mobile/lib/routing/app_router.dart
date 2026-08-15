import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/authentication/presentation/pages/login_page.dart';
import '../features/authentication/presentation/pages/register_page.dart';
import '../features/onboarding/presentation/pages/onboarding_page.dart';
import '../features/home/presentation/pages/home_page.dart';
import '../features/courses/presentation/pages/courses_page.dart';
import '../features/courses/presentation/pages/course_detail_page.dart';
import '../features/lessons/presentation/pages/lessons_page.dart';
import '../features/lessons/presentation/pages/lesson_detail_page.dart';
import '../features/exams/presentation/pages/exams_page.dart';
import '../features/exams/presentation/pages/exam_detail_page.dart';
import '../features/exams/presentation/pages/exam_taken_page.dart';
import '../features/questions/presentation/pages/questions_page.dart';
import '../features/library/presentation/pages/library_page.dart';
import '../features/ai_tutor/presentation/pages/ai_tutor_page.dart';
import '../features/flashcards/presentation/pages/flashcards_page.dart';
import '../features/progress/presentation/pages/progress_page.dart';
import '../features/gamification/presentation/pages/gamification_page.dart';
import '../features/community/presentation/pages/community_page.dart';
import '../features/notifications/presentation/pages/notifications_page.dart';
import '../features/profile/presentation/pages/profile_page.dart';
import '../features/profile/presentation/pages/settings_page.dart';
import '../features/subscriptions/presentation/pages/subscriptions_page.dart';
import '../features/subscriptions/presentation/pages/plans_page.dart';
import '../features/parent/presentation/pages/parent_dashboard_page.dart';
import '../features/teacher/presentation/pages/teacher_dashboard_page.dart';
import '../features/school/presentation/pages/school_page.dart';
import '../features/live_classes/presentation/pages/live_classes_page.dart';
import '../features/live_classes/presentation/pages/class_session_page.dart';
import '../features/home/presentation/pages/forgot_password_page.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

GoRouter get router => _router;

final GoRouter _router = GoRouter(
  initialLocation: '/onboarding',
  navigatorKey: _rootNavigatorKey,
  debugLogDiagnostics: true,
  routes: [
    // Auth & Onboarding (no bottom nav)
    GoRoute(
      path: '/onboarding',
      builder: (_, __) => const OnboardingPage(),
    ),
    GoRoute(
      path: '/login',
      builder: (_, __) => const LoginPage(),
    ),
    GoRoute(
      path: '/register',
      builder: (_, __) => const RegisterPage(),
    ),
    GoRoute(
      path: '/forgot-password',
      builder: (_, __) => const ForgotPasswordPage(),
    ),
    GoRoute(
      path: '/reset-password',
      builder: (_, __) => const ResetPasswordPage(),
    ),
    GoRoute(
      path: '/verify-email',
      builder: (_, __) => const VerifyEmailPage(),
    ),

    // Main app shell with bottom navigation
    ShellRoute(
      navigatorKey: _shellNavigatorKey,
      builder: (context, state, child) {
        return MainShell(child: child);
      },
      routes: [
        GoRoute(
          path: '/home',
          pageBuilder: (_, state) => NoTransitionPage(child: const HomePage()),
        ),
        GoRoute(
          path: '/courses',
          pageBuilder: (_, state) => NoTransitionPage(child: const CoursesPage()),
        ),
        GoRoute(
          path: '/exams',
          pageBuilder: (_, state) => NoTransitionPage(child: const ExamsPage()),
        ),
        GoRoute(
          path: '/community',
          pageBuilder: (_, state) => NoTransitionPage(child: const CommunityPage()),
        ),
        GoRoute(
          path: '/profile',
          pageBuilder: (_, state) => NoTransitionPage(child: const ProfilePage()),
        ),

        // Detail pages
        GoRoute(
          path: '/courses/:courseId',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, state) => CustomTransitionPage(
            child: CourseDetailPage(courseId: state.pathParameters['courseId']!),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
        GoRoute(
          path: '/lessons/:courseId',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, state) => CustomTransitionPage(
            child: LessonsPage(courseId: state.pathParameters['courseId']!),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
        GoRoute(
          path: '/lessons/:courseId/:lessonId',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, state) => CustomTransitionPage(
            child: LessonDetailPage(
              courseId: state.pathParameters['courseId']!,
              lessonId: state.pathParameters['lessonId']!,
            ),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
        GoRoute(
          path: '/exams/:examId',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, state) => CustomTransitionPage(
            child: ExamDetailPage(examId: state.pathParameters['examId']!),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
        GoRoute(
          path: '/exams/:examId/take',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, state) => CustomTransitionPage(
            child: ExamTakenPage(examId: state.pathParameters['examId']!),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
        GoRoute(
          path: '/ai-tutor',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, __) => const CustomTransitionPage(
            child: AiTutorPage(),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
        GoRoute(
          path: '/flashcards',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, __) => const CustomTransitionPage(
            child: FlashcardsPage(),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
        GoRoute(
          path: '/progress',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, __) => const CustomTransitionPage(
            child: ProgressPage(),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
        GoRoute(
          path: '/gamification',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, __) => const CustomTransitionPage(
            child: GamificationPage(),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
        GoRoute(
          path: '/notifications',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, __) => const CustomTransitionPage(
            child: NotificationsPage(),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
        GoRoute(
          path: '/subscriptions',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, __) => const CustomTransitionPage(
            child: SubscriptionsPage(),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
        GoRoute(
          path: '/subscriptions/plans',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, __) => const CustomTransitionPage(
            child: PlansPage(),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
        GoRoute(
          path: '/settings',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, __) => const CustomTransitionPage(
            child: SettingsPage(),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
        GoRoute(
          path: '/parent',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, __) => const CustomTransitionPage(
            child: ParentDashboardPage(),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
        GoRoute(
          path: '/teacher',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, __) => const CustomTransitionPage(
            child: TeacherDashboardPage(),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
        GoRoute(
          path: '/library',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, __) => const CustomTransitionPage(
            child: LibraryPage(),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
        GoRoute(
          path: '/questions',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, __) => const CustomTransitionPage(
            child: QuestionsPage(),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
        GoRoute(
          path: '/live-classes',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, __) => const CustomTransitionPage(
            child: LiveClassesPage(),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
        GoRoute(
          path: '/live-classes/:classId',
          parentNavigatorKey: _rootNavigatorKey,
          pageBuilder: (_, state) => CustomTransitionPage(
            child: ClassSessionPage(classId: state.pathParameters['classId']!),
            transitionsBuilder: (_, animation, __, child) => FadeTransition(opacity: animation, child: child),
          ),
        ),
      ],
    ),
  ],
  errorBuilder: (_, __) => const Scaffold(body: Center(child: Text('Page not found'))),
);

class MainShell extends ConsumerWidget {
  final Widget child;

  const MainShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: child,
      bottomNavigationBar: const MainBottomNav(),
    );
  }
}

class MainBottomNav extends ConsumerWidget {
  const MainBottomNav({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentPath = GoRouterState.of(context).matchedLocation;

    final items = [
      NavItem(label: 'Home', icon: Icons.home_outlined, activeIcon: Icons.home, path: '/home'),
      NavItem(label: 'Courses', icon: Icons.school_outlined, activeIcon: Icons.school, path: '/courses'),
      NavItem(label: 'Exams', icon: Icons.assignment_outlined, activeIcon: Icons.assignment, path: '/exams'),
      NavItem(label: 'Live', icon: Icons.videocam_outlined, activeIcon: Icons.videocam, path: '/live-classes'),
      NavItem(label: 'Community', icon: Icons.groups_outlined, activeIcon: Icons.groups, path: '/community'),
      NavItem(label: 'Profile', icon: Icons.person_outline, activeIcon: Icons.person, path: '/profile'),
    ];

    final selectedIndex = items.indexWhere((item) => currentPath.startsWith(item.path));

    return NavigationBar(
      selectedIndex: selectedIndex >= 0 ? selectedIndex : 0,
      height: 64,
      backgroundColor: Theme.of(context).colorScheme.surface,
      selectedIndexColor: Theme.of(context).colorScheme.primary,
      destinations: items.map((item) => NavigationDestination(
        icon: Icon(item.icon),
        selectedIcon: Icon(item.activeIcon),
        label: item.label,
      )).toList(),
      onDestinationSelected: (index) {
        context.go(items[index].path);
      },
    );
  }
}

class NavItem {
  final String label;
  final IconData icon;
  final IconData activeIcon;
  final String path;

  const NavItem({required this.label, required this.icon, required this.activeIcon, required this.path});
}

class VerifyEmailPage extends StatelessWidget {
  const VerifyEmailPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Verify Email')));
  }
}
