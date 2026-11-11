import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/utils/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/icon.svg' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (pathname === '/login') {
    if (session) {
      const target = session.role === 'CAPATAZ' ? '/capataz' : '/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/') {
    const target = session.role === 'CAPATAZ' ? '/capataz' : '/dashboard';
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Control de acceso basado en roles (RBAC)
  if (session.role === 'CAPATAZ') {
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/estadisticas') ||
      pathname.startsWith('/catalogo') ||
      pathname.startsWith('/usuarios')
    ) {
      return NextResponse.redirect(new URL('/capataz', request.url));
    }
  }

  if (session.role === 'DIRECTORIO') {
    if (pathname.startsWith('/usuarios') || pathname.startsWith('/catalogo')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (session.role === 'INGENIERO_ENCARGADO') {
    if (pathname.startsWith('/usuarios')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
