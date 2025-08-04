import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
  
  // API routes that don't require authentication
  const publicApiRoutes = [
    '/api/auth',
    '/api/recipes/search',
    '/api/recipes/discover',
    '/api/recipes' // Allow GET requests to browse public recipes
  ];
  
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Check if user is authenticated by looking for the session token
  const sessionToken = request.cookies.get('next-auth.session-token')?.value;
  
  if (!sessionToken) {
    // If no session token, redirect to login
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // For role-based access control, we'll need to implement this in the page components
  // since we can't easily decode the JWT in middleware without the secret
  
  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    // Match all routes except static files, images, and other assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};