import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  const hostWithoutPort = hostname.split(':')[0];
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ;

  // Check if this is the naked domain (hondukash.test) or www subdomain
  const isNakedDomain = hostWithoutPort === appDomain || hostWithoutPort === `www.${appDomain}`;

  // Check if this is a tenant subdomain (e.g., avoca.hondukash.test) - excluding www
  const isSubdomain = hostWithoutPort.endsWith(`.${appDomain}`) &&
                      hostWithoutPort !== appDomain &&
                      hostWithoutPort !== `www.${appDomain}`;

  // Extract subdomain name
  const subdomain = isSubdomain ? hostWithoutPort.split('.')[0] : null;

  console.log('isSubdomain', isSubdomain);
  console.log('subdomain', subdomain);

  if (isNakedDomain) {
    // Handle admin routes with authentication
    if (url.pathname.startsWith('/admin')) {
      // Check if user is trying to access login or signup page
      if (url.pathname === '/admin/login' || url.pathname === '/admin/signup') {
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
  if (isSubdomain && subdomain) {
    // Store tenant info in headers for the app to use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('X-TENANT-SUBDOMAIN', subdomain);

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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
