import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Authentication middleware for route protection
 * Protects routes based on authentication status and user roles
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/login', '/auth/register', '/auth/error'];
  if (publicRoutes.some(route => pathname === route)) {
    return NextResponse.next();
  }

  // API routes that don't require authentication regardless of method
  const publicApiRoutes = [
    '/api/auth',
    '/api/recipes/search',
    '/api/recipes/discover',
  ];

  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Public recipe browsing: only GET requests to /api/recipes are public.
  // Mutations (POST/PUT/DELETE) must be authenticated by their route handlers.
  if (pathname.startsWith('/api/recipes') && request.method === 'GET') {
    return NextResponse.next();
  }

  // Admin route protection - check for admin role
  if (pathname.startsWith('/admin')) {
    // Decode JWT token using NextAuth's getToken
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      });

      // If no token, redirect to login with unauthorized parameter
      if (!token) {
        const url = new URL('/auth/login', request.url);
        url.searchParams.set('unauthorized', '1');

        const response = NextResponse.redirect(url);
        response.headers.set('x-middleware-cache', 'no-cache');
        return response;
      }

      // Check if user has admin role
      if (token.role !== 'admin') {
        // Redirect non-admin users to home with unauthorized parameter
        const url = new URL('/', request.url);
        url.searchParams.set('unauthorized', '1');

        const response = NextResponse.redirect(url);
        response.headers.set('x-middleware-cache', 'no-cache');
        return response;
      }

      // Admin user - allow access
      return NextResponse.next();
    } catch (error) {
      // Token verification failed - redirect to login
      console.error('Admin middleware: Token verification failed:', error);
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('unauthorized', '1');

      const response = NextResponse.redirect(url);
      response.headers.set('x-middleware-cache', 'no-cache');
      return response;
    }
  }

  // Protected routes that require authentication
  const protectedRoutes = [
    '/profile',
    '/my-recipes',
    '/recipes/new',
    '/recipes/import',
    '/cookbooks',
    '/grocery-lists'
  ];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Check if user is authenticated by looking for the session token
    const sessionToken = request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value;

    if (!sessionToken) {
      // If no session token, redirect to login with callback URL
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('callbackUrl', pathname + request.nextUrl.search);

      // Add error handling headers
      const response = NextResponse.redirect(url);
      response.headers.set('x-middleware-cache', 'no-cache');
      return response;
    }
  }

  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    // Match all routes except static files, images, and other assets
    // Includes admin routes for role-based access control
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};