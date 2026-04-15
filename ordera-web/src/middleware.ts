import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('ordera_token')?.value;
  const { pathname } = request.nextUrl;

  // Path based routing: /[orgSlug]/dashboard, /[orgSlug]/login, etc.
  const pathParts = pathname.split('/').filter(Boolean);
  const orgSlug = pathParts[0];

  // If root path, let it pass (marketing home)
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Check if it's an org-specific path
  if (orgSlug) {
    const isLoginPath = pathname === `/${orgSlug}/login`;
    const isDashboardPath = pathname.startsWith(`/${orgSlug}/dashboard`) || 
                            pathname.startsWith(`/${orgSlug}/food-drinks`) ||
                            pathname.startsWith(`/${orgSlug}/orders`) ||
                            pathname.startsWith(`/${orgSlug}/bills`) ||
                            pathname.startsWith(`/${orgSlug}/messages`) ||
                            pathname.startsWith(`/${orgSlug}/settings`);

    // Protected routes: if dashboard and no token, redirect to login
    if (isDashboardPath && !token) {
      return NextResponse.redirect(new URL(`/${orgSlug}/login`, request.url));
    }

    // If login path and token exists, redirect to dashboard
    if (isLoginPath && token) {
      return NextResponse.redirect(new URL(`/${orgSlug}/dashboard`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files like logos)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo|public).*)',
  ],
};
