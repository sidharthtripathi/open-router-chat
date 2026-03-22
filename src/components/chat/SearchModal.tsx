"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface ChatPreview {
  id: string
  title: string | null
  created_at: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  chats: ChatPreview[]
}

export default function SearchModal({ isOpen, onClose, chats }: Props) {
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setSearch("")
      setSelectedId(null)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      // Optional cmd+k could be added here globally, but simple escape is enough for now inside modal
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const filtered = search
    ? chats.filter((c) =>
        c.title?.toLowerCase().includes(search.toLowerCase()),
      )
    : chats

  const selectedChat = chats.find((c) => c.id === selectedId)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 z-50 m-auto flex flex-col max-w-3xl max-h-[85vh] bg-[#111111] border border-border/50 rounded-2xl shadow-2xl overflow-hidden w-full"
          >
            {/* Search Input Header */}
            <div className="flex items-center px-4 py-3 border-b border-border/30 bg-[#161616]">
              <Search className="h-5 w-5 text-muted-foreground mr-3" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search history..."
                className="flex-1 bg-transparent border-none outline-none text-lg text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Split Pane */}
            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
              {/* Left sidebar: results */}
              <div className="w-full md:w-2/5 border-b md:border-b-0 md:border-r border-border/30 bg-[#111111] flex flex-col">
                <ScrollArea className="flex-1 p-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                    History
                  </h3>
                  {filtered.length === 0 ? (
                    <div className="text-sm text-muted-foreground px-3 py-4">
                      No results found.
                    </div>
                  ) : (
                    filtered.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedId(chat.id)}
                        className={`w-full text-left px-3 py-3 rounded-lg mb-1 transition-colors flex items-center justify-between group ${
                          selectedId === chat.id
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        }`}
                      >
                        <span className="truncate text-sm font-medium pr-2">
                          {chat.title || "Untitled Chat"}
                        </span>
                        <span className="text-xs opacity-50 shrink-0">
                          {new Date(chat.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                      </button>
                    ))
                  )}
                </ScrollArea>
              </div>

              {/* Right content: Preview */}
              <div className="w-full md:w-3/5 bg-[#0a0a0a] flex flex-col relative text-sm p-6">
                {selectedChat ? (
                  <>
                    <h2 className="text-xl font-semibold mb-4 text-foreground/90">
                      {selectedChat.title}
                    </h2>
                    <div className="text-muted-foreground space-y-4">
                      <p>
                        This is a preview pane. The exact messages could be fetched
                        and displayed here, similar to the Grok mockups.
                      </p>
                      <p>
                        For now, this demonstrates the split-pane search UI with a
                        blurred backdrop, matching the design request.
                      </p>
                    </div>

                    {/* Bottom Actions */}
                    <div className="absolute bottom-6 right-6 flex items-center gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          onClose()
                          router.push(`/chat/${selectedChat.id}`)
                        }}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Go <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    Select a chat to view preview
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
