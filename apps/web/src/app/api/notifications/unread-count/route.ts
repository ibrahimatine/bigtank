import { NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/auth-cookies';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function GET() {
  const token = await getValidAccessToken();
  if (!token) return NextResponse.json({ count: 0 });

  try {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
