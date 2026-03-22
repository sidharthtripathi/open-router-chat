"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useChatList } from "@/hooks/useChatList"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { motion } from "framer-motion"

export default function EmptyChatPage() {
  const router = useRouter()
  const { createChat } = useChatList()
  const [error, setError] = useState<string | null>(null)

  const handleNewChat = async () => {
    const result = await createChat()
    if (result.id) {
      setError(null)
      router.push(`/chat/${result.id}`)
    } else if (result.error) {
      setError(result.error)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md px-4"
        >
          <div className="mb-4 flex justify-center">
            <div className="p-4 rounded-full bg-secondary">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Start a new chat</h2>
          <p className="text-muted-foreground mb-6">
            Send a message to begin. Your conversation will appear here.
          </p>
          <Button onClick={handleNewChat} size="lg">
            New Chat
          </Button>
        </motion.div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
        >
          <p className="text-sm text-destructive mb-2">{error}</p>
          <Button
            onClick={() => router.push("/login")}
            variant="link"
            className="text-primary h-auto p-0"
          >
            Sign up for unlimited chats
          </Button>
        </motion.div>
      )}
    </div>
  )
}
