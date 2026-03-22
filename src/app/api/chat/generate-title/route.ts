import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import { OPENROUTER_BASE, openRouterHeaders } from "@/lib/openrouter/client"

const MAX_TITLE_INPUT_LENGTH = 2000

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
    const { chat_id, first_message } = await req.json()

    if (!chat_id || !first_message) {
      return NextResponse.json(
        { error: "Missing chat_id or first_message", code: "INVALID_REQUEST" },
        { status: 400 }
      )
    }

    // Validate first_message length to prevent abuse
    const trimmedMessage = first_message.trim()
    if (!trimmedMessage) {
      return NextResponse.json(
        { error: "first_message cannot be empty", code: "INVALID_REQUEST" },
        { status: 400 }
      )
    }
    if (trimmedMessage.length > MAX_TITLE_INPUT_LENGTH) {
      return NextResponse.json(
        { error: "first_message too long", code: "INVALID_REQUEST" },
        { status: 400 }
      )
    }

    // Authenticate the request
    const userId = await getAuthUserId(req)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify ownership of the chat
    const { data: chat, error: chatError } = await supabaseServer
      .from("chats")
      .select("user_id")
      .eq("id", chat_id)
      .single()

    if (chatError || !chat || chat.user_id !== userId) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    // Make the API call to OpenRouter
    const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: openRouterHeaders,
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          {
            role: "user",
            content: `Generate a short 4-6 word title for a chat that starts with: "${trimmedMessage.slice(0, 500)}". Reply with ONLY the title, no quotes, no punctuation.`,
          },
        ],
        max_tokens: 20,
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "OpenRouter API error", code: "OPENROUTER_ERROR" },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0]?.message?.content) {
      return NextResponse.json({ title: "New Chat" })
    }

    const title = data.choices[0].message.content.trim().slice(0, 100) || "New Chat"

    // Update the chat with the generated title
    const { error: updateError } = await supabaseServer
      .from("chats")
      .update({ title })
      .eq("id", chat_id)

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update title", code: "UPDATE_ERROR" },
        { status: 500 }
      )
    }

    return NextResponse.json({ title })
  } catch (err) {
    console.error("Title generation error:", err)
    return NextResponse.json(
      { error: "Title generation failed", code: "TITLE_ERROR" },
      { status: 500 }
    )
  }
}
