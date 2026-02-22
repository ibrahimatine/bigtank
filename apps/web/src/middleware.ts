import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/profile', '/chat'];
const AUTH_ROUTES = ['/login', '/register'];

function getJwtRole(token: string): string | null {
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf-8'),
    );
    return decoded.role || null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('bt_access')?.value;
  const { pathname } = request.nextUrl;

  // Admin routes — must be ADMIN role
  if (pathname.startsWith('/admin')) {
    if (!accessToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    const role = getJwtRole(accessToken);
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users away from protected routes
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r)) && !accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth routes
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && accessToken) {
    const role = getJwtRole(accessToken);
    return NextResponse.redirect(
      new URL(role === 'ADMIN' ? '/admin' : '/dashboard', request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/chat/:path*',
    '/login',
    '/register',
  ],
};
