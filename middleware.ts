import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth-edge';

export async function middleware(request: NextRequest) {
  // 1. Check if route is protected (starts with /admin)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // Allow access to login page
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // 2. Check for token
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // 3. Verify token
    const payload = await verifyToken(token);

    if (!payload) {
      // Invalid token
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Token valid, proceed
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
