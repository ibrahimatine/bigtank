import { NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/auth-cookies';

const GATEWAY = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function GET() {
  const token = await getValidAccessToken();
  if (!token) return NextResponse.json({ count: 0 });

  try {
    const res = await fetch(`${GATEWAY}/chat/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) return NextResponse.json({ count: 0 });

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
