"use client"

import { useRef, useState, useEffect } from "react"
import VoiceButton from "./VoiceButton"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowUp, Square } from "lucide-react"
import { motion } from "framer-motion"

interface Props {
  onSend: (
    content: string,
    image_urls?: string[],
  ) => Promise<{ success: boolean; error?: string; restore?: boolean }>
  streaming: boolean
  onStop: () => void
  chatId: string
  isVisionModel: boolean
  guestMessagesRemaining?: number
  guestMessageLimit?: number
}

export default function InputArea({
  onSend,
  streaming,
  onStop,
  guestMessagesRemaining = Infinity,
  guestMessageLimit = Infinity,
}: Props) {
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pendingTextRef = useRef<string>("")

  const isGuest = !Number.isFinite(guestMessagesRemaining)
  const showGuestLimit = isGuest && guestMessageLimit < Infinity

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px"
  }, [text])

  useEffect(() => {
    if (error) setError(null)
  }, [text])

  const handleSend = async () => {
    if (!text.trim()) return

    setError(null)
    pendingTextRef.current = text.trim()
    const textToSend = text.trim()
    setText("")

    const result = await onSend(textToSend)

    if (!result.success && result.restore) {
      setText(pendingTextRef.current)
      setError(result.error || "Message was not sent")
      return
    }

    if (!result.success) {
      setError(result.error || "Failed to send message")
      return
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isDisabled = !text.trim()

  return (
    <div className="w-full max-w-3xl mx-auto p-4 shrink-0">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-center"
        >
          <p className="text-sm text-destructive">{error}</p>
          {!isGuest && error.includes("Guest limit") && (
            <a
              href="/login"
              className="text-sm text-primary hover:underline mt-1 inline-block"
            >
              Sign up to continue chatting
            </a>
          )}
        </motion.div>
      )}

      {showGuestLimit && guestMessagesRemaining <= 3 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-3 bg-secondary/50 border border-border rounded-lg text-center"
        >
          <p className="text-sm text-secondary-foreground">
            {guestMessagesRemaining === 0
              ? "You've reached the guest message limit."
              : `You have ${guestMessagesRemaining} message${
                  guestMessagesRemaining === 1 ? "" : "s"
                } remaining as a guest.`}{" "}
            <a href="/login" className="text-primary hover:underline">
              Sign up for unlimited messages
            </a>
          </p>
        </motion.div>
      )}

      {/* Floating Pill Input */}
      <div className="relative flex items-end gap-2 bg-secondary/80 backdrop-blur-xl rounded-[32px] px-5 py-3 border border-border/50 shadow-lg focus-within:ring-1 focus-within:ring-white/20 transition-all duration-300">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            showGuestLimit && guestMessagesRemaining === 0
              ? "Guest limit reached..."
              : "Ask anything..."
          }
          rows={1}
          disabled={showGuestLimit && guestMessagesRemaining === 0}
          className="flex-1 bg-transparent resize-none outline-none border-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground py-2 disabled:opacity-50 text-base shadow-none"
          style={{ maxHeight: 200 }}
        />

        <div className="flex items-center self-end pb-1 shrink-0 gap-1">
          <VoiceButton
            onTranscript={(t) => setText((prev) => (prev ? prev + " " + t : t))}
          />

          {streaming ? (
            <Button
              onClick={onStop}
              size="icon"
              className="rounded-full w-9 h-9 bg-foreground text-background hover:bg-foreground/90 shrink-0"
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={
                isDisabled || (showGuestLimit && guestMessagesRemaining === 0)
              }
              size="icon"
              className="rounded-full w-9 h-9 bg-foreground text-background hover:bg-foreground/90 shrink-0 transition-opacity"
            >
              <ArrowUp className="h-5 w-5 stroke-[2.5]" />
            </Button>
          )}
        </div>
      </div>

      {showGuestLimit && (
        <div className="mt-3 flex justify-center">
          <span className="text-xs text-muted-foreground">
            {guestMessagesRemaining} of {guestMessageLimit} messages remaining
          </span>
        </div>
      )}
    </div>
  )
}
