// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  const protectedPaths = ['/properties', '/dashboard']
  const urlPath = request.nextUrl.pathname

  const isProtected = protectedPaths.some((path) =>
    urlPath.startsWith(path)
  )

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/properties/:path*', '/dashboard/:path*'], // protect both
}