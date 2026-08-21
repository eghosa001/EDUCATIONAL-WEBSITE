export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://backend-ogs7.vercel.app';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, rememberMe, deviceInfo } = body;

    if (!email || !password) {
      return Response.json({ success: false, error: 'Email and password required' }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe, deviceInfo }),
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
    console.error('[web auth login]', error);
    return Response.json(
      { success: false, error: 'Authentication service unavailable. Please try again.' },
      { status: 503 }
    );
  }
}
