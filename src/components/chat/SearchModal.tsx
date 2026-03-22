"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ExternalLink } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"

interface SearchResult {
  id: string
  title: string | null
  created_at: string
  updated_at: string
  snippet: string | null
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setResults([])
      setSelectedId(null)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({ q: q.trim() })
      const res = await fetch(`/api/chat/search?${params}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.results ?? [])
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setQuery(value)
    setSelectedId(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(value)
    }, 300)
  }

  const selectedResult = results.find((r) => r.id === selectedId)

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
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search chats and messages..."
                className="flex-1 bg-transparent border-none outline-none text-lg text-foreground placeholder:text-muted-foreground"
              />
              {loading && <Spinner className="h-4 w-4 text-muted-foreground mr-2" />}
            </div>

            {/* Split Pane */}
            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
              {/* Left sidebar: results */}
              <div className="w-full md:w-2/5 border-b md:border-b-0 md:border-r border-border/30 bg-[#111111] flex flex-col">
                <ScrollArea className="flex-1 p-3">
                  {results.length === 0 && !loading && query.trim() ? (
                    <div className="text-sm text-muted-foreground px-3 py-4 text-center">
                      No results found
                    </div>
                  ) : results.length === 0 && !query.trim() ? (
                    <div className="text-sm text-muted-foreground px-3 py-4 text-center">
                      Type to search your chat history
                    </div>
                  ) : (
                    results.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => setSelectedId(result.id)}
                        className={`w-full text-left px-3 py-3 rounded-lg mb-1 transition-colors flex flex-col gap-0.5 ${
                          selectedId === result.id
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        }`}
                      >
                        <span className="truncate text-sm font-medium pr-2">
                          {result.title || "Untitled Chat"}
                        </span>
                        {result.snippet && (
                          <span className="text-xs opacity-60 truncate pr-2">
                            {result.snippet}
                          </span>
                        )}
                        <span className="text-xs opacity-40 shrink-0">
                          {new Date(result.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </button>
                    ))
                  )}
                </ScrollArea>
              </div>

              {/* Right content: Preview */}
              <div className="w-full md:w-3/5 bg-[#0a0a0a] flex flex-col relative text-sm p-6">
                {selectedResult ? (
                  <>
                    <h2 className="text-xl font-semibold mb-4 text-foreground/90">
                      {selectedResult.title || "Untitled Chat"}
                    </h2>
                    {selectedResult.snippet && (
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        &ldquo;{selectedResult.snippet}&rdquo;
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      Created {new Date(selectedResult.created_at).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>

                    {/* Bottom Actions */}
                    <div className="absolute bottom-6 right-6 flex items-center gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          onClose()
                          router.push(`/chat/${selectedResult.id}`)
                        }}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Open Chat <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-center px-4">
                    {query.trim()
                      ? "Select a chat to preview"
                      : "Search your chat history by title or message content"}
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
