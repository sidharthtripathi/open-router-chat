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
  const [error, setError] = useState<string | null>(null)

  const handleFork = async () => {
    setLoading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    // Check if this published chat allows forking
    const { data: published } = await supabase
      .from("published_chats")
      .select("allow_fork, chat_id")
      .eq("chat_id", publishedChatId)
      .single()

    if (!published) {
      setError("This chat is not published and cannot be forked.")
      setLoading(false)
      return
    }

    if (!published.allow_fork) {
      setError("This chat's author has disabled forking.")
      setLoading(false)
      return
    }

    // Fetch all messages from the original chat
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", publishedChatId)
      .order("message_index", { ascending: true })

    if (messagesError) {
      setError("Failed to fetch messages. Please try again.")
      setLoading(false)
      return
    }

    // Get original chat details
    const { data: originalChat, error: chatError } = await supabase
      .from("chats")
      .select("*")
      .eq("id", publishedChatId)
      .single()

    if (chatError || !originalChat) {
      setError("Original chat not found.")
      setLoading(false)
      return
    }

    // Create new chat forked from this one
    const { data: newChat, error: forkError } = await supabase
      .from("chats")
      .insert({
        user_id: user.id,
        model_id: originalChat.model_id ?? "openai/gpt-4o-mini",
        title: `Fork of ${originalChat.title ?? "chat"}`,
        forked_from_chat_id: publishedChatId,
        forked_at_message_index: messages?.length ?? 0,
      })
      .select()
      .single()

    if (forkError || !newChat) {
      setError("Failed to create forked chat. Please try again.")
      setLoading(false)
      return
    }

    // Copy all messages to the new chat
    if (messages && messages.length > 0) {
      const { error: insertError } = await supabase.from("messages").insert(
        messages.map((m) => ({
          chat_id: newChat.id,
          role: m.role,
          content: m.content,
          model_id: m.model_id,
          image_urls: m.image_urls,
          message_index: m.message_index,
        })),
      )

      if (insertError) {
        setError("Failed to copy messages. Please try again.")
        setLoading(false)
        return
      }
    }

    router.push(`/chat/${newChat.id}`)
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleFork} disabled={loading} size="sm" variant="default">
        <GitFork className="h-4 w-4 mr-1" />
        {loading ? "Forking..." : "Continue this chat"}
      </Button>
      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}
    </div>
  )
}
