-- Single round-trip dashboard aggregate, scoped to auth.uid and all existing RLS.
-- SECURITY INVOKER is essential: never bypass enrolled learner row policies.
CREATE OR REPLACE FUNCTION public.student_dashboard_overview()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT jsonb_build_object(
    'enrolledCourses', (
      SELECT count(*)
      FROM public.student_courses sc
      WHERE sc.student_id = (SELECT auth.uid())
    ),
    'completedLessons', (
      SELECT count(DISTINCT lp.lesson_id)
      FROM public.lesson_progress lp
      WHERE lp.student_id = (SELECT auth.uid()) AND lp.status = 'completed'
    ),
    'totalStudyTimeSeconds', (
      SELECT COALESCE(sum(GREATEST(s.duration_seconds, 0)), 0)
      FROM public.study_sessions s
      WHERE s.student_id = (SELECT auth.uid())
    ),
    'averageCourseProgress', (
      SELECT COALESCE(round(avg(GREATEST(0, LEAST(sc.progress_percentage, 100))), 1), 0)
      FROM public.student_courses sc
      WHERE sc.student_id = (SELECT auth.uid())
    ),
    'examsTaken', (
      SELECT count(*)
      FROM public.exam_attempts e
      WHERE e.student_id = (SELECT auth.uid()) AND e.submitted_at IS NOT NULL
    ),
    'averageExamScore', (
      SELECT COALESCE(round(avg(e.percentage), 1), 0)
      FROM public.exam_attempts e
      WHERE e.student_id = (SELECT auth.uid()) AND e.submitted_at IS NOT NULL
    )
  );
$function$;
REVOKE ALL ON FUNCTION public.student_dashboard_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_dashboard_overview() TO authenticated;
COMMENT ON FUNCTION public.student_dashboard_overview() IS
  'RLS-safe user-specific aggregate for the learner dashboard; avoids downloading study history.';
