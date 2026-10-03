import { createClient } from '@supabase/supabase-js';

const escapeXml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const shorten = (value: unknown, max: number) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
};

export async function GET(_request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !publicKey) return new Response('Visual service unavailable', { status: 503 });

  const supabase = createClient(supabaseUrl, publicKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('id,title,learning_objectives,key_points,is_published')
    .eq('id', lessonId)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !lesson) return new Response('Lesson not found', { status: 404 });

  const objectives = Array.isArray(lesson.learning_objectives) ? lesson.learning_objectives : [];
  const keyPoints = Array.isArray(lesson.key_points) ? lesson.key_points : [];
  const points = [...keyPoints, ...objectives]
    .map((item) => shorten(item, 112))
    .filter(Boolean)
    .filter((item, index, rows) => rows.indexOf(item) === index)
    .slice(0, 3);

  while (points.length < 3) {
    points.push([
      'Identify the main idea and important terms in the lesson.',
      'Connect the lesson idea to its examples and explanations.',
      'Use practice questions to check your understanding.',
    ][points.length]);
  }

  const title = escapeXml(shorten(lesson.title, 88));
  const p1 = escapeXml(points[0]);
  const p2 = escapeXml(points[1]);
  const p3 = escapeXml(points[2]);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700" role="img" aria-labelledby="title desc">
<title id="title">${title}</title><desc id="desc">Visual summary of three key ideas from this lesson.</desc>
<rect width="1200" height="700" rx="36" fill="#f8fafc"/>
<rect x="60" y="55" width="1080" height="120" rx="28" fill="#151A3A"/>
<text x="100" y="105" font-family="Arial,sans-serif" font-size="25" font-weight="700" fill="#cbd5e1">LESSON VISUAL SUMMARY</text>
<text x="100" y="145" font-family="Arial,sans-serif" font-size="31" font-weight="700" fill="#ffffff">${title}</text>
<line x1="600" y1="175" x2="600" y2="230" stroke="#94a3b8" stroke-width="4"/>
<rect x="110" y="230" width="980" height="110" rx="24" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
<circle cx="165" cy="285" r="26" fill="#151A3A"/><text x="157" y="295" font-family="Arial,sans-serif" font-size="25" font-weight="700" fill="#ffffff">1</text>
<text x="215" y="295" font-family="Arial,sans-serif" font-size="23" fill="#334155">${p1}</text>
<line x1="600" y1="340" x2="600" y2="385" stroke="#94a3b8" stroke-width="4"/>
<rect x="110" y="385" width="980" height="110" rx="24" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
<circle cx="165" cy="440" r="26" fill="#151A3A"/><text x="157" y="450" font-family="Arial,sans-serif" font-size="25" font-weight="700" fill="#ffffff">2</text>
<text x="215" y="450" font-family="Arial,sans-serif" font-size="23" fill="#334155">${p2}</text>
<line x1="600" y1="495" x2="600" y2="540" stroke="#94a3b8" stroke-width="4"/>
<rect x="110" y="540" width="980" height="110" rx="24" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
<circle cx="165" cy="595" r="26" fill="#151A3A"/><text x="157" y="605" font-family="Arial,sans-serif" font-size="25" font-weight="700" fill="#ffffff">3</text>
<text x="215" y="605" font-family="Arial,sans-serif" font-size="23" fill="#334155">${p3}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
