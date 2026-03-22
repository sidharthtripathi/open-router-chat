import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { OPENROUTER_BASE, openRouterHeaders } from "@/lib/openrouter/client"
import { truncateMessages } from "@/lib/utils"
import { ALLOWED_MODELS } from "@/lib/constants"

export async function POST(req: NextRequest) {
  try {
    const { messages, model_id, chat_id, is_guest } = await req.json()

    if (!messages || !model_id) {
      return NextResponse.json(
        { error: "Missing required fields", code: "INVALID_REQUEST" },
        { status: 400 }
      )
    }

    // Validate model_id against allowlist
    if (!ALLOWED_MODELS.includes(model_id as typeof ALLOWED_MODELS[number])) {
      return NextResponse.json(
        { error: "Invalid model", code: "INVALID_MODEL" },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // For authenticated users, verify ownership of the chat
    if (!is_guest && chat_id) {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      // Verify the chat belongs to this user
      const { data: chat, error: chatError } = await supabase
        .from("chats")
        .select("user_id")
        .eq("id", chat_id)
        .single()

      if (chatError || !chat || chat.user_id !== user.id) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 })
      }
    }

    let history = messages

    // For authenticated users, fetch full message history from DB
    if (!is_guest && chat_id) {
      const { data: dbMessages } = await supabase
        .from("messages")
        .select("role, content")
        .eq("chat_id", chat_id)
        .order("message_index", { ascending: true })

      history = truncateMessages([...(dbMessages ?? []), ...messages], 6000)
    } else {
      history = truncateMessages(messages, 6000)
    }

    const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: openRouterHeaders,
      body: JSON.stringify({
        model: model_id,
        messages: history,
        stream: true,
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "OpenRouter API error", code: "OPENROUTER_ERROR" },
        { status: response.status }
      )
    }

    // Stream response back to client
    const encoder = new TextEncoder()
    let fullContent = ""

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const data = line.slice(6).trim()
            if (data === "[DONE]") {
              // Save assistant message to DB only for authenticated users
              if (!is_guest && chat_id) {
                const { count } = await supabase
                  .from("messages")
                  .select("id", { count: "exact", head: true })
                  .eq("chat_id", chat_id)

                await supabase.from("messages").insert({
                  chat_id,
                  role: "assistant",
                  content: fullContent,
                  model_id,
                  message_index: count ?? 0,
                })

                // Update chat model + timestamp
                await supabase
                  .from("chats")
                  .update({ model_id, updated_at: new Date().toISOString() })
                  .eq("id", chat_id)
              }

              controller.close()
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                fullContent += content
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
              }
            } catch {
              // skip malformed
            }
          }
        }

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    )
  }
}
