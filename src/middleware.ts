import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale, isValidLocale } from './lib/i18n/config'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if the pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) {
    return NextResponse.next()
  }

  // Detect locale from cookie or Accept-Language header
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  const headerLocale = request.headers
    .get('accept-language')
    ?.split(',')[0]
    ?.split('-')[0]

  let locale = defaultLocale

  if (cookieLocale && isValidLocale(cookieLocale)) {
    locale = cookieLocale
  } else if (headerLocale && isValidLocale(headerLocale)) {
    locale = headerLocale
  }

  // Redirect to the locale-prefixed URL
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname}`

  const response = NextResponse.redirect(url)

  // Set the locale cookie
  response.cookies.set('NEXT_LOCALE', locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  })

  return response
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, static files, images)
    '/((?!api|_next/static|_next/image|favicon.ico|images|icons|.*\\..*).*)'
  ],
}
