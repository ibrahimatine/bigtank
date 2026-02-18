import { NextResponse } from 'next/server';
import { getRefreshToken, setAuthCookies, clearAuthCookies } from '@/lib/auth-cookies';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function POST() {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();

    if (!res.ok) {
      await clearAuthCookies();
      return NextResponse.json({ error: 'Session expiree' }, { status: 401 });
    }

    const tokens = data.data || data;
    await setAuthCookies(tokens.accessToken, tokens.refreshToken);

    return NextResponse.json({ success: true });
  } catch {
    await clearAuthCookies();
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
