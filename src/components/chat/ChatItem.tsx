"use client"

import { useState } from "react"
import Link from "next/link"
import { Chat } from "@/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pin, PinOff, Pencil, Trash2 } from "lucide-react"
import { motion } from "framer-motion"

interface Props {
  chat: Chat
  active: boolean
  onDelete: (id: string) => void
  onTogglePin: (id: string, isPinned: boolean) => void
  onRename: (id: string, title: string) => void
}

export default function ChatItem({
  chat,
  active,
  onDelete,
  onTogglePin,
  onRename,
}: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(chat.title ?? "New Chat")

  const handleRename = () => {
    onRename(chat.id, editText)
    setEditing(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
      className={`group relative flex items-center rounded-md px-2 py-2 cursor-pointer transition-colors ${
        active
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
      }`}
    >
      <Link href={`/chat/${chat.id}`} className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            onClick={(e) => e.preventDefault()}
            className="w-full text-sm outline-none bg-transparent text-foreground"
          />
        ) : (
          <p className="text-sm truncate flex items-center gap-1">
            {chat.is_pinned && (
              <Pin className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
            {chat.title ?? "New Chat"}
          </p>
        )}
      </Link>

      <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() => {
              setEditing(true)
              setShowMenu(false)
            }}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onTogglePin(chat.id, chat.is_pinned)
              setShowMenu(false)
            }}
          >
            {chat.is_pinned ? (
              <>
                <PinOff className="h-4 w-4 mr-2" />
                Unpin
              </>
            ) : (
              <>
                <Pin className="h-4 w-4 mr-2" />
                Pin
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onDelete(chat.id)
              setShowMenu(false)
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  )
}
