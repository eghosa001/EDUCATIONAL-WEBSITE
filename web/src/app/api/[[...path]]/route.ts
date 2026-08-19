import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || '';

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}

async function proxyRequest(request: NextRequest): Promise<NextResponse> {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { success: false, error: { code: 'CONFIG_ERROR', message: 'API_URL environment variable is not configured' } },
      { status: 503 }
    );
  }

  const path = request.nextUrl.pathname.replace(/^\/api/, '');
  const targetUrl = `${BACKEND_URL}${path}`;

  const url = new URL(targetUrl);
  
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    headers.set('Authorization', authHeader);
  }

  let body: string | undefined = undefined;
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const jsonData = await request.json();
      body = JSON.stringify(jsonData);
    } catch {
      body = undefined;
    }
  }

  try {
    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      body: body !== undefined ? body : undefined,
    });

    const data = await response.text();
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('[API Proxy] Error:', error?.message || String(error));
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'PROXY_ERROR', 
          message: 'Backend unavailable. Check API_URL configuration.' 
        } 
      },
      { status: 503 }
    );
  }
}
