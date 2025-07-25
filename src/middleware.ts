import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only handle API routes and let client-side auth handle page routing
  if (pathname.startsWith('/api/')) {
    // You can add API authentication checks here if needed
    return NextResponse.next();
  }
  
  // Allow all page routes and let the client-side AuthProvider handle redirects
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 