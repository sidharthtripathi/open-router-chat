"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useChat } from "@/hooks/useChat"
import { useChatList } from "@/hooks/useChatList"
import { isVisionCapable } from "@/lib/openrouter/models"
import { useModels } from "@/hooks/useModels"
import ChatHeader from "@/components/chat/ChatHeader"
import MessageThread from "@/components/chat/MessageThread"
import InputArea from "@/components/chat/InputArea"
import { ChatPageSkeleton } from "@/components/ui/skeleton"
import { Chat } from "@/types"
import { User } from "@supabase/supabase-js"

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [chat, setChat] = useState<Chat | null>(null)
  const [chatLoading, setChatLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const { models } = useModels()
  const { deleteChat, renameChat } = useChatList()
  const [streamStarted, setStreamStarted] = useState(false)

  // Check if we need to start streaming (coming from home page with a new message)
  const needsStreaming = searchParams.get("needs_streaming") === "true"

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

    setChatLoading(true)
    supabase
      .from("chats")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setChat(data)
        setChatLoading(false)
      })

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
    // Only trigger streaming if we came from home page with needs_streaming=true
    // and we haven't already started streaming
    if (!needsStreaming || streamStarted || messages.length === 0 || !id) return

    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role === "user" && !streaming) {
      setStreamStarted(true)
      startStreamingForExistingMessages()
    }
  }, [needsStreaming, messages, streaming, id, streamStarted, startStreamingForExistingMessages])

  const visionCapable = models.some(
    (m) => m.id === model && isVisionCapable(m),
  )

  const handleDelete = async () => {
    await deleteChat(id)
    router.push("/")
  }

  const handleRetry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user")
    if (lastUser) editMessage(lastUser.message_index, lastUser.content)
  }

  const handleSend = async (content: string, image_urls?: string[]) => {
    const result = await sendMessage(content, image_urls)
    return result
  }

  if (chatLoading) {
    return <ChatPageSkeleton />
  }

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
        guestMessagesRemaining={999}
        guestMessageLimit={999}
      />
    </div>
  )
}
