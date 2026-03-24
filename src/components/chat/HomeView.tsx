"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useModels } from "@/hooks/useModels"
import MessageThread from "./MessageThread"
import InputArea from "./InputArea"
import ModelSelector from "./ModelSelector"
import { isVisionCapable } from "@/lib/openrouter/models"
import { supabase } from "@/lib/supabase/client"
import { useChatList } from "@/hooks/useChatList"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"

interface Props {
  user: User
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
  const [messages, setMessages] = useState<any[]>([])
  const [model, setModel] = useState("openai/gpt-4o-mini")
  const [streaming, setStreaming] = useState(false)
  const [streamContent, setStreamContent] = useState("")
  const [sending, setSending] = useState(false)

  const visionCapable = models.some(
    (m) => m.id === model && isVisionCapable(m),
  )

  const handleSend = useCallback(
    async (content: string, image_urls?: string[]) => {
      if (sending) return { success: false, error: "Already sending", restore: false }
      setSending(true)

      // Create a new chat first
      const result = await createChat()
      if (!result.id) {
        setSending(false)
        return { success: false, error: "Failed to create chat", restore: true }
      }

      const chatId = result.id

      // Add user message to state for UI feedback
      const userMsg = {
        id: `temp-${Date.now()}`,
        chat_id: chatId,
        role: "user",
        content,
        model_id: null,
        image_urls: image_urls ?? null,
        message_index: 0,
        created_at: new Date().toISOString(),
      }
      setMessages([userMsg])

      try {
        // Start the streaming API call - we need to at least start it before redirecting
        // The user message will be saved by the API before streaming starts
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content }],
            model_id: model,
            chat_id: chatId,
            save_user_message: true,
          }),
        })

        if (!res.ok) {
          const errorData = await res.json()
          setMessages([])
          setSending(false)
          return { success: false, error: errorData.error || "Failed to get response", restore: true }
        }

        // Stream the response briefly to ensure user message is saved
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()

        // Read just the first chunk (to ensure the request was received)
        const { done } = await reader.read()
        reader.releaseLock()

        // Now redirect - user message is saved, ChatPage will continue streaming
        router.push(`/chat/${chatId}?needs_streaming=true`)
      } catch (err: any) {
        setMessages([])
        setSending(false)
        if (err.name !== "AbortError") {
          return { success: false, error: "An error occurred", restore: true }
        }
        return { success: false, error: "Cancelled", restore: true }
      }

      setSending(false)
      return { success: true }
    },
    [model, createChat, router, sending],
  )

  const handleRetry = () => {
    // Not applicable on home view
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header with controls */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/40 bg-background/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-sm font-semibold truncate text-foreground/80">
            New Chat
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ModelSelector value={model} onChange={setModel} />
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
                  onClick={() => !sending && handleSend(suggestion)}
                  disabled={sending}
                  className="text-left px-4 py-3.5 rounded-xl border border-border/60 bg-secondary/40 hover:bg-secondary/80 hover:border-border transition-all duration-200 group disabled:opacity-50"
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
            onEdit={() => {}}
            onRetry={handleRetry}
          />
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0">
        <InputArea
          onSend={handleSend}
          streaming={streaming}
          onStop={() => {}}
          chatId="home"
          isVisionModel={visionCapable}
          guestMessagesRemaining={999}
          guestMessageLimit={999}
        />
      </div>
    </div>
  )
}
