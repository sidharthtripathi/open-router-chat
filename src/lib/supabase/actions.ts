"use server"

import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = cookies()
  cookieStore.set('sb-access-token', accessToken)
  cookieStore.set('sb-refresh-token', refreshToken)
}

export async function clearAuthCookies() {
  const cookieStore = cookies()
  cookieStore.delete('sb-access-token')
  cookieStore.delete('sb-refresh-token')
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = cookies()
  return cookieStore.get('sb-access-token')?.value ?? null
}

export async function getUserFromServer() {
  const accessToken = await getAccessToken()
  if (!accessToken) return null

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (error || !user) return null
  return user
}
