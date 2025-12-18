/**
 * Next.js Middleware
 * 
 * Intercepts all requests to detect platform from domain.
 * Sets platform context via headers and cookies.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPlatformByDomain, DEFAULT_PLATFORM_ID, getPlatform } from './config/platforms'

/**
 * Domain to platform mapping for production
 * This is auto-generated from platforms config but can be extended
 */
function detectPlatformFromDomain(hostname: string): string | null {
  const platform = getPlatformByDomain(hostname)
  return platform?.id || null
}

/**
 * Local development detection
 */
function detectPlatformFromEnvOrQuery(request: NextRequest): string | null {
  // Check query param override (for dev/testing)
  const queryPlatform = request.nextUrl.searchParams.get('platform')
  if (queryPlatform && getPlatform(queryPlatform)) {
    return queryPlatform
  }
  
  // Check cookie (for persisting dev choice)
  const cookiePlatform = request.cookies.get('platform_id')?.value
  if (cookiePlatform && getPlatform(cookiePlatform)) {
    return cookiePlatform
  }
  
  return null
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  // Try to detect platform from domain first (production)
  let platformId = detectPlatformFromDomain(hostname)
  
  // If not found (likely localhost), check env/query/cookie
  if (!platformId) {
    platformId = detectPlatformFromEnvOrQuery(request)
  }
  
  // Fall back to default
  if (!platformId) {
    platformId = process.env.NEXT_PUBLIC_PLATFORM_ID || DEFAULT_PLATFORM_ID
  }
  
  const platform = getPlatform(platformId)
  
  if (!platform) {
    // This shouldn't happen, but fallback to default
    platformId = DEFAULT_PLATFORM_ID
  }
  
  // Create response with platform headers
  const response = NextResponse.next()
  
  // Set headers for server components and API routes
  response.headers.set('x-platform-id', platformId)
  
  // Set cookie for client-side access and persistence
  response.cookies.set('platform_id', platformId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  })
  
  return response
}

/**
 * Configure which paths the middleware runs on
 * Exclude static files, images, and API routes that don't need platform context
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|logos|favicons|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
