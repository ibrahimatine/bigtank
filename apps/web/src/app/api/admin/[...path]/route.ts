import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/auth-cookies';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function proxyRequest(request: NextRequest, params: Promise<{ path: string[] }>) {
  try {
    const token = await getValidAccessToken();
    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { path } = await params;
    const subPath = path.join('/');
    const url = new URL(`${API_BASE}/admin/${subPath}`);

    // Forward query params
    const searchParams = request.nextUrl.searchParams;
    searchParams.forEach((value, key) => url.searchParams.set(key, value));

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    let body: string | undefined;
    if (request.method !== 'GET' && request.method !== 'DELETE') {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        headers['Content-Type'] = 'application/json';
        body = await request.text();
      }
    }

    const res = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
    });

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx.params);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx.params);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx.params);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(req, ctx.params);
}
