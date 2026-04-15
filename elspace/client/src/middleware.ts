import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  const { pathname } = request.nextUrl

  // Public routes
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/legal/privacy',
    '/legal/terms',
    '/legal/cookies',
    '/api/auth',
    '/api/webhooks',
  ]

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based access control
  const userRole = token.role as string

  // Admin-only routes
  const adminRoutes = ['/admin']
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Moderator and admin routes
  const moderatorRoutes = ['/admin/disputes', '/admin/users']
  if (moderatorRoutes.some(route => pathname.startsWith(route))) {
    if (userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Freelancer-only routes
  const freelancerRoutes = ['/sessions/availability', '/proposals/my']
  if (freelancerRoutes.some(route => pathname.startsWith(route))) {
    if (userRole !== 'FREELANCER' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Client-only routes
  const clientRoutes = ['/projects/post']
  if (clientRoutes.some(route => pathname.startsWith(route))) {
    if (userRole !== 'CLIENT' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Check email verification
  if (!token.emailVerified && !pathname.startsWith('/verify-email')) {
    return NextResponse.redirect(new URL('/verify-email', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
