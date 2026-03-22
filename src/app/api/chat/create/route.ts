import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { DEFAULT_MODEL } from "@/lib/constants"

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // If not authenticated, guest chats in-memory only — no DB record
    if (!user) {
      return NextResponse.json({ id: null, guest: true })
    }

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
  } catch (err) {
    console.error("Chat creation error:", err)
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    )
  }
}
