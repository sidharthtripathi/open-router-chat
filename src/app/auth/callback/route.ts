import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { setAuthCookies } from '@/lib/supabase/actions'

export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/chat'

  if (code) {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      await setAuthCookies(data.session.access_token, data.session.refresh_token)
    }
  }

  return NextResponse.redirect(new URL(next, req.url))
}
