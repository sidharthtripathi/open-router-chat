"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useChat } from "@/hooks/useChat"
import { useChatList } from "@/hooks/useChatList"
import { isVisionCapable } from "@/lib/openrouter/models"
import { useModels } from "@/hooks/useModels"
import ChatHeader from "@/components/chat/ChatHeader"
import MessageThread from "@/components/chat/MessageThread"
import InputArea from "@/components/chat/InputArea"
import { Chat } from "@/types"
import { User } from "@supabase/supabase-js"
import { GUEST_MESSAGE_LIMIT } from "@/lib/constants"

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [chat, setChat] = useState<Chat | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const { models } = useModels()
  const { deleteChat, renameChat } = useChatList()
  const [guestMessageCount, setGuestMessageCount] = useState(0)
  const [streamStarted, setStreamStarted] = useState(false)

  const {
    messages,
    model,
    setModel,
    streaming,
    streamContent,
    generatedTitle,
    sendMessage,
    stopStreaming,
    editMessage,
    startStreamingForExistingMessages,
  } = useChat(id, chat?.model_id ?? "openai/gpt-4o-mini")

  useEffect(() => {
    if (!id) return

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    supabase
      .from("chats")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => setChat(data))

    const channel = supabase
      .channel(`chat-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chats",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setChat(payload.new as Chat)
        },
      )
      .subscribe()

    if (typeof window !== "undefined") {
      const count = parseInt(
        localStorage.getItem("guest_message_count") || "0",
        10,
      )
      setGuestMessageCount(count)
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  useEffect(() => {
    if (generatedTitle && chat && chat.title !== generatedTitle) {
      setChat({ ...chat, title: generatedTitle })
    }
  }, [generatedTitle, chat])

  useEffect(() => {
    if (streamStarted || messages.length === 0 || !id) return

    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role === "user" && !streaming) {
      setStreamStarted(true)
      startStreamingForExistingMessages()
    }
  }, [messages, streaming, id, streamStarted, startStreamingForExistingMessages])

  const visionCapable = models.some(
    (m) => m.id === model && isVisionCapable(m),
  )

  const handleDelete = async () => {
    await deleteChat(id)
    router.push("/chat")
  }

  const handleRetry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user")
    if (lastUser) editMessage(lastUser.message_index, lastUser.content)
  }

  const handleSend = async (content: string, image_urls?: string[]) => {
    const result = await sendMessage(content, image_urls)

    if (result.success && typeof window !== "undefined") {
      const count = parseInt(
        localStorage.getItem("guest_message_count") || "0",
        10,
      )
      setGuestMessageCount(count)
    }

    return result
  }

  const remainingGuestMessages = Math.max(
    0,
    GUEST_MESSAGE_LIMIT - guestMessageCount,
  )

  return (
    <div className="flex flex-col h-full bg-background">
      <ChatHeader
        chatId={id}
        title={chat?.title ?? null}
        model={model}
        user={user}
        onModelChange={setModel}
        onRename={(title) => renameChat(id, title)}
        onDelete={handleDelete}
      />

      <MessageThread
        messages={messages}
        streamContent={streamContent}
        streaming={streaming}
        currentModel={model}
        onEdit={editMessage}
        onRetry={handleRetry}
      />

      <InputArea
        onSend={handleSend}
        streaming={streaming}
        onStop={stopStreaming}
        chatId={id}
        isVisionModel={visionCapable}
        guestMessagesRemaining={remainingGuestMessages}
        guestMessageLimit={GUEST_MESSAGE_LIMIT}
      />
    </div>
  )
}
