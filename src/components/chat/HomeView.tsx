"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@/hooks/useChat"
import { useModels } from "@/hooks/useModels"
import MessageThread from "./MessageThread"
import InputArea from "./InputArea"
import ModelSelector from "./ModelSelector"
import { isVisionCapable } from "@/lib/openrouter/models"
import { supabase } from "@/lib/supabase/client"
import { useChatList } from "@/hooks/useChatList"
import { User } from "@supabase/supabase-js"
import { GUEST_MESSAGE_LIMIT } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Orbit } from "lucide-react"

interface Props {
  user: User | null
}

const promptSuggestions = [
  "Help me write a Python function",
  "Explain quantum computing simply",
  "Write a creative short story",
  "Review my code for bugs",
]

export default function HomeView({ user }: Props) {
  const router = useRouter()
  const { models } = useModels()
  const { createChat } = useChatList()
  const [localUser, setLocalUser] = useState(user)

  const isGuest = !localUser

  const {
    messages,
    model,
    setModel,
    streaming,
    streamContent,
    sendMessage,
    stopStreaming,
    editMessage,
    resetChat,
    remainingGuestMessages,
  } = useChat(null, "openai/gpt-4o-mini", isGuest)

  useEffect(() => {
    setLocalUser(user)
  }, [user])

  const visionCapable = models.some(
    (m) => m.id === model && isVisionCapable(m),
  )

  const handleSend = useCallback(
    async (content: string, image_urls?: string[]) => {
      if (localUser && messages.length === 0) {
        const result = await createChat()
        if (!result.id) {
          return { success: false, error: "Failed to create chat", restore: true }
        }

        const userMsg = {
          chat_id: result.id,
          role: "user",
          content,
          image_urls: image_urls ?? null,
          message_index: 0,
        }

        const { error: msgError } = await supabase
          .from("messages")
          .insert(userMsg)

        if (msgError) {
          return { success: false, error: msgError.message, restore: true }
        }

        router.push(`/chat/${result.id}`)
        return { success: true }
      }

      const result = await sendMessage(content, image_urls)
      return result
    },
    [localUser, messages.length, createChat, router, sendMessage],
  )

  const handleRetry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user")
    if (lastUser) editMessage(lastUser.message_index, lastUser.content)
  }

  const handleNewChat = () => {
    resetChat()
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header with controls */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/40 bg-background/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-sm font-semibold truncate text-foreground/80">
            {messages.length === 0 ? "New Chat" : "Chat"}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ModelSelector value={model} onChange={setModel} />

          {localUser && (
            <Button onClick={handleNewChat} variant="outline" size="sm">
              New Chat
            </Button>
          )}

          <ThemeToggle />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {messages.length === 0 ? (
          /* Empty State: Greeting + Suggestion Cards */
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="mb-8 text-center">
              <h2 className="text-4xl font-bold tracking-tight text-foreground mb-2">
                Hi there 👋
              </h2>
              <p className="text-lg text-muted-foreground">
                How can I help you today?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
              {promptSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(suggestion)}
                  className="text-left px-4 py-3.5 rounded-xl border border-border/60 bg-secondary/40 hover:bg-secondary/80 hover:border-border transition-all duration-200 group"
                >
                  <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground">
                    {suggestion}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages Thread */
          <MessageThread
            messages={messages}
            streamContent={streamContent}
            streaming={streaming}
            currentModel={model}
            onEdit={editMessage}
            onRetry={handleRetry}
          />
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0">
        <InputArea
          onSend={handleSend}
          streaming={streaming}
          onStop={stopStreaming}
          chatId="home"
          isVisionModel={visionCapable}
          guestMessagesRemaining={remainingGuestMessages}
          guestMessageLimit={GUEST_MESSAGE_LIMIT}
        />
      </div>
    </div>
  )
}
