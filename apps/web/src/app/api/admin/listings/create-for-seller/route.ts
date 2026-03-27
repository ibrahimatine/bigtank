import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/auth-cookies';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function POST(req: NextRequest) {
  const token = await getValidAccessToken();
  if (!token) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }

  try {
    const body = await req.text();
    const res = await fetch(`${API_BASE}/admin/listings/create-for-seller`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
