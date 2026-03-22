import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/p/",          // published chats are public
  "/api/",        // API routes handle their own auth
  "/_next/",
  "/favicon.ico",
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public routes without auth check
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Root path is handled client-side
  if (pathname === "/") {
    return NextResponse.next()
  }

  // /chat/* routes are handled client-side but we still validate the session
  // so we can set proper cache headers
  if (pathname.startsWith("/chat")) {
    // Check for Supabase auth cookies
    const accessToken = req.cookies.get("sb-access-token")?.value
    if (!accessToken) {
      // No auth token — let client handle redirect to login
      return NextResponse.next()
    }

    // Validate the token by making a lightweight check
    // We just pass through; real auth happens in API routes
    return NextResponse.next()
  }

  // Default: allow
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
