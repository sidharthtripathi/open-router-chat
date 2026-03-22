import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const MAX_SEARCH_LENGTH = 200
const MAX_RESULTS = 20

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")?.trim() ?? ""
    const offset = parseInt(searchParams.get("offset") ?? "0", 10)

    if (!query || query.length > MAX_SEARCH_LENGTH) {
      return NextResponse.json({ results: [], total: 0 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Search by title and by message content
    const { data, error, count } = await supabase
      .from("chats")
      .select(
        "id, title, created_at, updated_at, model_id, is_pinned",
        { count: "exact" }
      )
      .eq("user_id", user.id)
      .or(
        `title.ilike.%${query}%,id.in:(select chat_id from messages where content ilike %${query}%)`
      )
      .order("updated_at", { ascending: false })
      .range(offset, offset + MAX_RESULTS - 1)

    if (error) {
      return NextResponse.json(
        { error: "Search failed" },
        { status: 500 }
      )
    }

    // For each chat, get a matching message snippet
    const chats = data ?? []
    const results = await Promise.all(
      chats.map(async (chat) => {
        const { data: messages } = await supabase
          .from("messages")
          .select("content")
          .eq("chat_id", chat.id)
          .ilike("content", `%${query}%`)
          .limit(1)
          .maybeSingle()

        return {
          id: chat.id,
          title: chat.title,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
          snippet: messages?.content?.slice(0, 200) ?? null,
        }
      })
    )

    return NextResponse.json({
      results,
      total: count ?? 0,
      offset,
      hasMore: (count ?? 0) > offset + MAX_RESULTS,
    })
  } catch (err) {
    console.error("Search error:", err)
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    )
  }
}
