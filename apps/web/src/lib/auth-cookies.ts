import { cookies } from 'next/headers';

const ACCESS_COOKIE = 'bt_access';
const REFRESH_COOKIE = 'bt_refresh';
const IS_PROD = process.env.NODE_ENV === 'production';

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 900, // 15 min
  });

  cookieStore.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 604800, // 7 days
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE)?.value;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Returns a valid access token, refreshing it automatically if expired.
 * Returns undefined if no token and no refresh token available.
 */
export async function getValidAccessToken(): Promise<string | undefined> {
  const accessToken = await getAccessToken();
  if (accessToken) return accessToken;

  // No access token — try to refresh
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return undefined;

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    await clearAuthCookies();
    return undefined;
  }

  const data = await res.json();
  const tokens = data.data || data;
  await setAuthCookies(tokens.accessToken, tokens.refreshToken);
  return tokens.accessToken;
}
