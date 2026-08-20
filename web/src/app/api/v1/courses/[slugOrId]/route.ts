import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ slugOrId: string }> }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { slugOrId } = await params;
  const isUuid = slugOrId.length === 36;

  let course;
  if (isUuid) {
    const { data, error } = await supabase.from('courses').select('*').eq('id', slugOrId).single();
    if (error || !data) return Response.json({ success: false, error: 'Course not found' }, { status: 404 });
    course = data;
  } else {
    const { data, error } = await supabase.from('courses').select('*').eq('slug', slugOrId).single();
    if (error || !data) return Response.json({ success: false, error: 'Course not found' }, { status: 404 });
    course = data;
  }

  const { data: lessons } = await supabase.from('lessons').select('*').eq('course_id', course.id).eq('is_published', true).order('order_index');
  const { data: sections } = await supabase.from('course_sections').select('*').eq('course_id', course.id).order('order_index');

  return Response.json({
    success: true,
    data: { course: { ...course, lessons: lessons || [], sections: sections || [] } },
  });
}
