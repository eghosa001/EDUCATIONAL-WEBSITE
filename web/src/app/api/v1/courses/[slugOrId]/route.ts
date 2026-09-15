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
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !publicKey) {
    return Response.json({ success: false, error: 'Course service is not configured' }, { status: 503 });
  }

  // Use the same public Supabase project/key as the catalogue and browser learning flows.
  // The previous service-role-only lookup could point at a mismatched/missing project key,
  // which made a course visible in /api/v1/courses but 404 in the detail route.
  const supabase = createClient(supabaseUrl, publicKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { slugOrId } = await params;
  const decoded = decodeURIComponent(slugOrId);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(decoded);

  let lookup = supabase.from('courses').select('*').eq('status', 'published').limit(1);
  lookup = isUuid ? lookup.eq('id', decoded) : lookup.eq('slug', decoded);
  const { data: course, error: courseError } = await lookup.maybeSingle();
  if (courseError) {
    return Response.json({ success: false, error: 'Unable to load course' }, { status: 502 });
  }
  if (!course) {
    return Response.json({ success: false, error: 'Course not found' }, { status: 404 });
  }

  const [lessonResult, sectionResult] = await Promise.all([
    supabase.from('lessons').select('*').eq('course_id', course.id).eq('is_published', true).order('order_index'),
    supabase.from('course_sections').select('*').eq('course_id', course.id).eq('is_active', true).order('order_index'),
  ]);

  if (lessonResult.error) {
    return Response.json({ success: false, error: 'Unable to load course lessons' }, { status: 502 });
  }

  // Sections are legacy/optional for newer topic-driven curriculum courses.
  const sections = sectionResult.error ? [] : (sectionResult.data || []);
  const lessons = (lessonResult.data || []).filter(lesson => isPublishableLesson(lesson));

  return Response.json(
    { success: true, data: { course: { ...course, lessons, sections } } },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
