import { NextResponse } from 'next/server';
import { getAccessToken, getRefreshToken, setAuthCookies, clearAuthCookies } from '@/lib/auth-cookies';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchMe(token: string) {
  return fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function GET() {
  try {
    let accessToken = await getAccessToken();

    if (!accessToken) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    let res = await fetchMe(accessToken);

    // If 401, try silent refresh
    if (res.status === 401) {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        await clearAuthCookies();
        return NextResponse.json({ user: null }, { status: 401 });
      }

      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshRes.ok) {
        await clearAuthCookies();
        return NextResponse.json({ user: null }, { status: 401 });
      }

      const tokens = await refreshRes.json();
      const newTokens = tokens.data || tokens;
      await setAuthCookies(newTokens.accessToken, newTokens.refreshToken);

      // Retry with new token
      res = await fetchMe(newTokens.accessToken);
    }

    if (!res.ok) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const data = await res.json();
    const user = data.data || data;

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
