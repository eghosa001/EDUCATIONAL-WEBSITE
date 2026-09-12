import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const TEMPLATE_PATTERNS = [
  /this lesson covers .* a fundamental concept/i,
  /core concept.*fundamental idea behind/i,
  /apply the relevant formula for/i,
  /identify the given information/i,
  /a simple sentence demonstrating/i,
  /this objective means that you should be able to identify the relevant concept/i,
  /is a mathematical concept taught in the nigerian/i,
];

function isPublishableLesson(lesson: Record<string, unknown>) {
  const title = typeof lesson.title === 'string' ? lesson.title.trim() : '';
  const written = typeof lesson.written_content === 'string' ? lesson.written_content.replace(/\s+/g, ' ').trim() : '';
  const objectives = Array.isArray(lesson.learning_objectives) ? lesson.learning_objectives.filter(Boolean) : [];
  const keyPoints = Array.isArray(lesson.key_points) ? lesson.key_points.filter(Boolean) : [];
  const combined = `${title} ${written}`;
  return Boolean(
    lesson.is_published === true &&
    lesson.content_quality !== 'needs_review' &&
    title &&
    written.length >= 700 &&
    objectives.length >= 2 &&
    keyPoints.length >= 2 &&
    !TEMPLATE_PATTERNS.some(pattern => pattern.test(combined))
  );
}

export async function GET(_request: Request, { params }: { params: Promise<{ slugOrId: string }> }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ success: false, error: 'Course service is not configured' }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { slugOrId } = await params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugOrId);

  const lookup = isUuid
    ? supabase.from('courses').select('*').eq('id', slugOrId).eq('status', 'published').single()
    : supabase.from('courses').select('*').eq('slug', slugOrId).eq('status', 'published').single();
  const { data: course, error: courseError } = await lookup;
  if (courseError || !course) {
    return Response.json({ success: false, error: 'Course not found' }, { status: 404 });
  }

  const [lessonResult, sectionResult] = await Promise.all([
    supabase.from('lessons').select('*').eq('course_id', course.id).eq('is_published', true).order('order_index'),
    supabase.from('course_sections').select('*').eq('course_id', course.id).eq('is_active', true).order('order_index'),
  ]);

  if (lessonResult.error || sectionResult.error) {
    return Response.json({ success: false, error: 'Unable to load course content' }, { status: 502 });
  }

  const lessons = (lessonResult.data || []).filter(lesson => isPublishableLesson(lesson));
  return Response.json(
    { success: true, data: { course: { ...course, lessons, sections: sectionResult.data || [] } } },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
