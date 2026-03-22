"use client"

import { useEffect, useRef, useState } from "react"
import { Message as MessageType } from "@/types"
import Message from "./Message"
import { motion } from "framer-motion"

interface Props {
  messages: MessageType[]
  streamContent: string
  streaming: boolean
  currentModel: string
  onEdit: (index: number, content: string) => void
  onRetry: () => void
}

const promptSuggestions = [
  "Help me write a Python function",
  "Explain quantum computing simply",
  "Write a creative short story",
  "Review my code for bugs",
]

export default function MessageThread({
  messages,
  streamContent,
  streaming,
  currentModel,
  onEdit,
  onRetry,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamContent])

  if (messages.length === 0 && !streaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-semibold text-foreground mb-2">
            Hi there
          </h2>
          <p className="text-muted-foreground text-lg">
            What would you like to know?
          </p>
        </motion.div>

        {/* Prompt Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 gap-3 w-full max-w-2xl"
        >
          {promptSuggestions.map((text, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0.4 }}
              whileHover={{ opacity: 1, borderColor: "hsl(var(--border))" }}
              transition={{ duration: 0.2 }}
              className="p-4 rounded-lg border border-transparent bg-secondary/30 text-left opacity-40 hover:opacity-100 transition-all"
            >
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {text}
              </span>
            </motion.button>
          ))}
        </motion.div>

        {/* Subtle hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-muted-foreground mt-8"
        >
          Press Enter to send, Shift+Enter for new line
        </motion.p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-3xl mx-auto">
        {messages.map((msg) => (
          <Message
            key={msg.id}
            message={msg}
            currentModel={currentModel}
            onEdit={msg.role === "user" ? onEdit : undefined}
            onRetry={msg.role === "assistant" ? onRetry : undefined}
          />
        ))}

        {/* Streaming message */}
        {streaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start mb-4"
          >
            <div className="max-w-[75%] px-4 py-3 rounded-2xl bg-secondary text-sm leading-relaxed whitespace-pre-wrap">
              {streamContent || (
                <span className="flex gap-1">
                  <span
                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
              )}
              {streamContent && (
                <span className="inline-block w-0.5 h-4 bg-foreground ml-0.5 animate-pulse align-middle" />
              )}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
