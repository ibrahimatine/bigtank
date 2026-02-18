import { NextResponse } from 'next/server';
import { getAccessToken, getRefreshToken, clearAuthCookies } from '@/lib/auth-cookies';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function POST() {
  try {
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();

    // Best-effort logout on backend
    if (accessToken && refreshToken) {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }

    await clearAuthCookies();

    return NextResponse.json({ success: true });
  } catch {
    await clearAuthCookies();
    return NextResponse.json({ success: true });
  }
}
