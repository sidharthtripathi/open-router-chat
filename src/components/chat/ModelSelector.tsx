"use client"

import { useState, useRef, useEffect } from "react"
import { useModels } from "@/hooks/useModels"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Eye } from "lucide-react"

interface Props {
  value: string
  onChange: (modelId: string) => void
}

export default function ModelSelector({ value, onChange }: Props) {
  const { grouped, loading } = useModels()

  const allModels = [
    ...grouped.frontier.map((m) => ({ ...m, group: "Frontier" })),
    ...grouped.fast.map((m) => ({ ...m, group: "Fast" })),
    ...grouped.vision.map((m) => ({ ...m, group: "Vision" })),
  ]

  const current = allModels.find((m) => m.id === value)

  const [search, setSearch] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter models by search
  const filteredModels = search.trim()
    ? allModels.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allModels

  // Reset highlight when search changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [search])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!filteredModels.length) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, filteredModels.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && filteredModels[highlightedIndex]) {
      e.preventDefault()
      onChange(filteredModels[highlightedIndex].id)
      setSearch("")
      inputRef.current?.blur()
    }
  }

  const handleSelect = (modelId: string) => {
    onChange(modelId)
    setSearch("")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <span className="max-w-[120px] truncate">{current?.name ?? value}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2">
          <Input
            ref={inputRef}
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8"
          />
        </div>
        <DropdownMenuSeparator />

        {loading && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading models...
          </div>
        )}

        {!loading && filteredModels.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No models found
          </div>
        )}

        {!loading && filteredModels.length > 0 && (() => {
          // When searching, flatten into single group
          if (search.trim()) {
            return (
              <ScrollArea className="max-h-80">
                {filteredModels.map((m, i) => (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() => handleSelect(m.id)}
                    className={`gap-2 cursor-pointer ${i === highlightedIndex ? "bg-accent" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(m.context_length / 1000).toFixed(0)}k ctx
                      </p>
                    </div>
                    {m.group === "Vision" && (
                      <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            )
          }

          // Normal grouped view
          return (["Frontier", "Fast", "Vision"] as const).map((group) => {
            const items = filteredModels.filter((m) => m.group === group)
            if (!items.length) return null
            return (
              <div key={group}>
                <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
                  {group}
                </DropdownMenuLabel>
                {items.map((m, i) => (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() => handleSelect(m.id)}
                    className="gap-2 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(m.context_length / 1000).toFixed(0)}k ctx
                      </p>
                    </div>
                    {group === "Vision" && (
                      <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </div>
            )
          })
        })()}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
