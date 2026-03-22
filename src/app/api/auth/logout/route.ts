import { NextResponse } from "next/server"
import { clearAuthCookies } from "@/lib/supabase/actions"

export async function POST() {
  await clearAuthCookies()
  return NextResponse.json({ success: true })
}
