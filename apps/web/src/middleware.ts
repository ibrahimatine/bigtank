import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/profile', '/chat'];
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('bt_access')?.value;
  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users away from protected routes
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r)) && !accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth routes
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/chat/:path*', '/login', '/register'],
};
