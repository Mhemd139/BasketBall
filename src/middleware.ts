import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale, isValidLocale } from './lib/i18n/config'

const publicPaths = ['/login', '/favicon.ico', '/api/auth']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 1. Handle Locale Logic
  
  // Check if pathname has locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // Get locale from path or cookie
  let locale = defaultLocale
  if (pathnameHasLocale) {
     const pathLocale = pathname.split('/')[1]
     if (isValidLocale(pathLocale)) {
        locale = pathLocale
     }
  } else {
     // Detect from cookie/header
     const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
     if (cookieLocale && isValidLocale(cookieLocale)) {
       locale = cookieLocale
     }
  }

  // 2. Strict Auth Enforcement
  // Check for admin_session cookie
  const session = request.cookies.get('admin_session')
  
  // Determine if requested path is public
  const pathWithoutLocale = pathnameHasLocale 
    ? '/' + pathname.split('/').slice(2).join('/') 
    : pathname
  
  // Only explicitly defined public paths are allowed
  const isPublic = publicPaths.some(p => pathWithoutLocale.startsWith(p))
  
  const loginUrl = new URL(`/${locale}/login`, request.url)
  const dashboardUrl = new URL(`/${locale}`, request.url)

  if (!session && !isPublic) {
     return NextResponse.redirect(loginUrl)
  }

  if (session && pathWithoutLocale === '/login') {
     return NextResponse.redirect(dashboardUrl)
  }

  // 3. Locale Redirect (if missing)
  if (!pathnameHasLocale) {
    const url = request.nextUrl.clone()
    url.pathname = `/${locale}${pathname}`
    return NextResponse.redirect(url)
  }

  // Set locale cookie if present 
  const response = NextResponse.next()
  if (locale) {
    response.cookies.set('NEXT_LOCALE', locale, {
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
    })
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
