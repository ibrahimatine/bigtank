import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth-cookies';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function POST(request: Request) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await request.json();

  try {
    const res = await fetch(`${API_BASE}/payments/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
