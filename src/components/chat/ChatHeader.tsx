"use client"

import { useState } from "react"
import ModelSelector from "./ModelSelector"
import PublishModal from "./PublishModal"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash2, Globe } from "lucide-react"

interface Props {
  chatId: string
  title: string | null
  model: string
  user: User | null
  onModelChange: (modelId: string) => void
  onRename: (title: string) => void
  onDelete: () => void
}

export default function ChatHeader({
  chatId,
  title,
  model,
  user,
  onModelChange,
  onRename,
  onDelete,
}: Props) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleText, setTitleText] = useState(title ?? "New Chat")
  const [showPublish, setShowPublish] = useState(false)

  const handleTitleConfirm = () => {
    onRename(titleText)
    setEditingTitle(false)
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/40 bg-card">
        <div className="flex items-center gap-3 min-w-0">
          {editingTitle ? (
            <Input
              autoFocus
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              onBlur={handleTitleConfirm}
              onKeyDown={(e) => e.key === "Enter" && handleTitleConfirm()}
              className="text-sm font-semibold h-8"
            />
          ) : (
            <h1
              onClick={() => setEditingTitle(true)}
              className="text-sm font-semibold truncate cursor-pointer hover:opacity-70 transition-opacity"
            >
              {title ?? "New Chat"}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ModelSelector value={model} onChange={onModelChange} />

          <Button onClick={() => setShowPublish(true)} variant="outline" size="sm">
            <Globe className="h-4 w-4 mr-1" />
            Publish
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showPublish && (
        <PublishModal
          chatId={chatId}
          chatTitle={title ?? "New Chat"}
          onClose={() => setShowPublish(false)}
        />
      )}
    </>
  )
}
