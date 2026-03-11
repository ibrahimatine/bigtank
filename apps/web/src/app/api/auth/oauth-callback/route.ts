import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookies } from '@/lib/auth-cookies';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accessToken = searchParams.get('accessToken');
  const refreshToken = searchParams.get('refreshToken');

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', req.url));
  }

  await setAuthCookies(accessToken, refreshToken);
  return NextResponse.redirect(new URL('/', req.url));
}
