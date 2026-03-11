import { NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/auth-cookies';

const GATEWAY = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function GET(request: Request) {
  const token = await getValidAccessToken();
  if (!token) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const limit = searchParams.get('limit');

  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', limit);

  const url = `${GATEWAY}/chat/conversations${params.toString() ? `?${params}` : ''}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const token = await getValidAccessToken();
  if (!token) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const body = await request.json();

  const res = await fetch(`${GATEWAY}/chat/conversations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
