import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import { DEFAULT_MODEL } from "@/lib/constants"

async function getAuthUserId(req: NextRequest): Promise<string | null> {
  const accessToken = req.cookies.get("sb-access-token")?.value
  if (!accessToken) return null
  try {
    const { data: { user } } = await supabaseServer.auth.getUser(accessToken)
    return user?.id ?? null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { guest_session_id } = await req.json()

    const userId = await getAuthUserId(req)

    // If authenticated, create chat with user_id
    if (userId) {
      const { data, error } = await supabaseServer
        .from("chats")
        .insert({
          user_id: userId,
          model_id: DEFAULT_MODEL,
          title: null,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ id: data.id })
    }

    // For guests, require a valid guest_session_id
    if (!guest_session_id || typeof guest_session_id !== "string" || guest_session_id.length > 200) {
      return NextResponse.json({ error: "Invalid guest session" }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from("chats")
      .insert({
        guest_session_id,
        model_id: DEFAULT_MODEL,
        title: null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error("Chat creation error:", err)
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    )
  }
}
