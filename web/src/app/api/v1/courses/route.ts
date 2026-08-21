export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-ogs7.vercel.app';

export async function GET(request: Request) {
  try {
    const incoming = new URL(request.url);
    const target = new URL(`${BACKEND_URL}/api/v1/courses`);
    incoming.searchParams.forEach((value, key) => target.searchParams.set(key, value));

    const response = await fetch(target, {
      headers: {
        ...(request.headers.get('authorization')
          ? { Authorization: request.headers.get('authorization') as string }
          : {}),
      },
      cache: 'no-store',
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: false, error: text || 'Backend returned an invalid response' };
    }

    return Response.json(data, { status: response.status });
  } catch (error) {
    console.error('[web courses]', error);
    return Response.json(
      { success: false, error: 'Course service unavailable. Please try again.' },
      { status: 503 }
    );
  }
}
