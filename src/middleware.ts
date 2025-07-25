import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Handle hostname with port (e.g., hondukash.test:3000)
  const hostWithoutPort = hostname.split(':')[0];
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'hondukash.test';

  console.log('Middleware:', { hostname, hostWithoutPort, pathname: url.pathname, appDomain });

  // Check if this is the naked domain (hondukash.test)
  const isNakedDomain = hostWithoutPort === appDomain;

  // Check if this is a subdomain (e.g., avoca.hondukash.test)
  const isSubdomain = hostWithoutPort.endsWith(`.${appDomain}`) && hostWithoutPort !== appDomain;

  // Extract subdomain name
  const subdomain = isSubdomain ? hostWithoutPort.split('.')[0] : null;

  console.log('Domain analysis:', { isNakedDomain, isSubdomain, subdomain });

  if (isNakedDomain) {
    // Handle admin routes with authentication
    if (url.pathname.startsWith('/admin')) {
      // Check if user is trying to access login page
      if (url.pathname === '/admin/login') {
        return NextResponse.next();
      }

      // Check for admin session cookie for protected routes
      const adminSession = request.cookies.get('admin-session');

      if (!adminSession) {
        // Redirect to admin login if not authenticated
        url.pathname = '/admin/login';
        return NextResponse.redirect(url);
      }

      return NextResponse.next();
    }

    // For non-admin routes on naked domain, just continue
    return NextResponse.next();
  }

  // Tenant access (tenant.hondukash.test or custom domain)
  if (isSubdomain && subdomain && subdomain !== 'www') {
    // Store tenant info in headers for the app to use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant', subdomain);

    console.log('Tenant detected:', subdomain);

    // If accessing root, redirect to login
    if (url.pathname === '/') {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
  }
  
  // Default redirect to admin for unrecognized domains
  url.pathname = '/admin';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};
