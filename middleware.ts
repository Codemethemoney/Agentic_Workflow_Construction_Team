import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get user token from cookie
  const token = request.cookies.get('token');

  // Protected routes that require authentication
  const protectedPaths = ['/team', '/settings', '/workflows'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // Admin-only routes
  const adminPaths = ['/team'];
  const isAdminPath = adminPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Additional role checks can be implemented here
  if (isAdminPath) {
    // Check user role from token or session
    const userRole = getUserRole(token);
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

function getUserRole(token: string | undefined): string {
  // Implement token validation and role extraction
  return 'user';
}

export const config = {
  matcher: [
    '/team/:path*',
    '/settings/:path*',
    '/workflows/:path*',
  ],
};