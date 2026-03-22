import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

const PUBLIC_ROUTES = [
  "/login",
  "/auth/callback",
  "/signup",
  "/p/",
  "/_next/",
  "/favicon.ico",
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Root path
  if (pathname === "/") {
    return NextResponse.next()
  }

  // /chat/* routes — validate session but let client handle redirect
  if (pathname.startsWith("/chat")) {
    // Create a response and refresh the session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              req.cookies.set(name, value)
            })
            const response = NextResponse.next()
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    await supabase.auth.getUser()

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
