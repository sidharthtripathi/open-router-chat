"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { GitFork } from "lucide-react"

interface Props {
  publishedChatId: string
}

export default function ForkButton({ publishedChatId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleFork = async () => {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", publishedChatId)
      .order("message_index", { ascending: true })

    const { data: originalChat } = await supabase
      .from("chats")
      .select("*")
      .eq("id", publishedChatId)
      .single()

    const { data: newChat, error } = await supabase
      .from("chats")
      .insert({
        user_id: user?.id ?? null,
        model_id: originalChat?.model_id ?? "openai/gpt-4o-mini",
        title: `Fork of ${originalChat?.title ?? "chat"}`,
        forked_from_chat_id: publishedChatId,
        forked_at_message_index: messages?.length ?? 0,
      })
      .select()
      .single()

    if (error || !newChat) {
      setLoading(false)
      return
    }

    if (messages && messages.length > 0) {
      await supabase.from("messages").insert(
        messages.map((m) => ({
          chat_id: newChat.id,
          role: m.role,
          content: m.content,
          model_id: m.model_id,
          image_urls: m.image_urls,
          message_index: m.message_index,
        })),
      )
    }

    router.push(`/chat/${newChat.id}`)
    setLoading(false)
  }

  return (
    <Button onClick={handleFork} disabled={loading} size="sm" variant="default">
      <GitFork className="h-4 w-4 mr-1" />
      {loading ? "Forking..." : "Continue this chat"}
    </Button>
  )
}
