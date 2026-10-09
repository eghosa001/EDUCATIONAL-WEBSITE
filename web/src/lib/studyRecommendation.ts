/**
 * Choose the next step from actual learner activity, not generic guessed mastery.
 * Pure logic shared by the dashboard and its regression tests.
 */
export interface FocusSignal {
  dueCount: number | null;
  weakTopic: {
    topicId: string;
    topicName: string;
    subjectName: string;
    attempts: number;
    correct: number;
    accuracy: number;
  } | null;
  partialFailure?: boolean;
}
export interface RecentCourseSignal {
  courseId: string;
  courseTitle: string;
  progressPercentage: number;
}

export interface StudyRecommendation {
  kind: 'weak-topic' | 'due-flashcards' | 'continue-course' | 'start';
  eyebrow: string;
  title: string;
  explanation: string;
  href: string;
  action: string;
}

export function chooseStudyRecommendation(
  signal: FocusSignal | null,
  courses: RecentCourseSignal[],
): StudyRecommendation {
  if (signal?.weakTopic) {
    const topic = signal.weakTopic;
    return {
      kind: 'weak-topic',
      eyebrow: 'Based on your practice results',
      title: `Strengthen ${topic.topicName}`,
      explanation: `${topic.correct} of ${topic.attempts} recent answers correct (${topic.accuracy}%). Review this topic and try again.`,
      href: `/dashboard/flashcards?topic=${encodeURIComponent(topic.topicId)}`,
      action: 'Revise weak topic',
    };
  }
  if (typeof signal?.dueCount === 'number' && signal.dueCount > 0) {
    return {
      kind: 'due-flashcards',
      eyebrow: 'Scheduled revision',
      title: `${signal.dueCount} flashcard${signal.dueCount === 1 ? '' : 's'} due`,
      explanation: 'Return to previously studied cards before they become harder to recall.',
      href: '/dashboard/flashcards',
      action: 'Review due cards',
    };
  }
  const course = courses.find(item =>
    Boolean(item.courseId) &&
    Number.isFinite(item.progressPercentage) &&
    item.progressPercentage < 100,
  );
  if (course) {
    return {
      kind: 'continue-course',
      eyebrow: 'Continue where you left off',
      title: course.courseTitle || 'Continue your course',
      explanation: `${Math.max(0, Math.round(course.progressPercentage))}% completed. Return to the next lesson in your course.`,
      href: `/dashboard/courses/${encodeURIComponent(course.courseId)}`,
      action: 'Continue course',
    };
  }
  return {
    kind: 'start',
    eyebrow: 'Build your first study habit',
    title: 'Choose a course to study',
    explanation: 'Start with one subject and a short lesson. Your next steps will become personalised as you practise.',
    href: '/dashboard/courses',
    action: 'Browse courses',
  };
}
