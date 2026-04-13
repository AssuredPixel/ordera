import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('ordera_token')?.value;
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                           request.nextUrl.pathname.startsWith('/food-drinks') ||
                           request.nextUrl.pathname.startsWith('/messages') ||
                           request.nextUrl.pathname.startsWith('/bills') ||
                           request.nextUrl.pathname.startsWith('/settings');

  if (isDashboardRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (request.nextUrl.pathname.endsWith('/login') && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/food-drinks/:path*',
    '/messages/:path*',
    '/bills/:path*',
    '/settings/:path*',
    '/login',
  ],
};
