import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth/session';

/**
 * Protects /admin/* (except /admin/login). Verifies the signed session
 * JWT at the edge with jose — no DB call, no secrets in the browser.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === '/admin/login';
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  // Already signed in but on the login page → send to the dashboard.
  if (isLogin && session) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Any other admin route requires a valid session.
  if (!isLogin && !session) {
    const url = new URL('/admin/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
