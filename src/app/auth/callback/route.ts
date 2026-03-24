import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  let response = NextResponse.redirect(new URL(next, req.url))

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            console.log('[AUTH_CALLBACK] Setting cookies:', cookiesToSet.map(c => ({ name: c.name, options: c.options })))
            cookiesToSet.forEach(({ name, value, options }) => {
              req.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('[AUTH_CALLBACK] Code exchange result:', { error, hasSession: !!data.session, session: data.session ? { user: data.session.user, expiresAt: data.session.expires_at } : null })

    if (error) {
      console.error('Auth callback error:', error)
    }
  } else {
    console.log('[AUTH_CALLBACK] No code in URL, searchParams:', Object.fromEntries(url.searchParams))
  }

  return response
}
