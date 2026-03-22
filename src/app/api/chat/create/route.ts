import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { DEFAULT_MODEL } from "@/lib/constants"

export async function POST(req: NextRequest) {
  try {
    const { guest_session_id } = await req.json()

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // If authenticated, create chat with user_id
    if (user) {
      const { data, error } = await supabase
        .from("chats")
        .insert({
          user_id: user.id,
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

    const { data, error } = await supabase
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
