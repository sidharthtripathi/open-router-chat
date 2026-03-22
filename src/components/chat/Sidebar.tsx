"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useChatList } from "@/hooks/useChatList"
import { groupChatsByDate } from "@/lib/utils"
import ChatItem from "./ChatItem"
import { supabase } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Search,
  Plus,
  LogOut,
  LogIn,
  PanelLeft,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const COLLAPSED_WIDTH = 64
const EXPANDED_WIDTH = 260

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onOpenSearch: () => void
}

export default function Sidebar({ collapsed, onToggle, onOpenSearch }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { chats, createChat, deleteChat, togglePin, renameChat } =
    useChatList()
  const [user, setUser] = useState<User | null>(null)
  const [guestLimitError, setGuestLimitError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const activeChatId = pathname?.split("/chat/")?.[1] ?? null

  const handleNewChat = async () => {
    const result = await createChat()
    if (result.id) {
      setGuestLimitError(null)
      router.push(`/chat/${result.id}`)
    } else if (result.error) {
      setGuestLimitError(result.error)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteChat(id)
    if (activeChatId === id) router.push("/chat")
  }

  const pinnedChats = chats.filter((c) => c.is_pinned)
  const unpinnedChats = chats.filter((c) => !c.is_pinned)

  const grouped = groupChatsByDate(unpinnedChats)

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="h-full flex flex-col bg-background/50 border-r border-border/40 relative backdrop-blur-md overflow-hidden"
    >
      {/* Header */}
      <div className="p-3 flex items-center justify-end">
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-9 w-9 shrink-0"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Expanded Content */}
      {!collapsed && (
        <div className="flex flex-col flex-1">
            {/* Guest limit error */}
            {guestLimitError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-3 mb-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
              >
                <p className="text-sm text-destructive mb-2">
                  {guestLimitError}
                </p>
                <Button
                  onClick={() => {
                    setGuestLimitError(null)
                    router.push("/login")
                  }}
                  variant="link"
                  className="text-primary h-auto p-0"
                >
                  Sign up for unlimited chats
                </Button>
              </motion.div>
            )}

            {/* Search */}
            <div className="px-3 pb-2">
              <button
                onClick={onOpenSearch}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground/70 bg-secondary/30 hover:bg-secondary/60 hover:text-foreground rounded-lg border border-border/20 transition-colors"
                style={{ justifyContent: "flex-start" }}
              >
                <Search className="h-4 w-4 shrink-0" />
                <span>Search</span>
              </button>
            </div>

            {/* New Chat Button */}
            <div className="px-3 pb-2">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
                style={{ justifyContent: "flex-start" }}
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>New Chat</span>
              </button>
            </div>

            {/* Chat list */}
            <ScrollArea className="flex-1 px-2 pb-4">
              {/* Pinned */}
              {pinnedChats.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wide">
                    Pinned
                  </p>
                  {pinnedChats.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      active={chat.id === activeChatId}
                      onDelete={handleDelete}
                      onTogglePin={togglePin}
                      onRename={renameChat}
                    />
                  ))}
                </div>
              )}

              {/* Grouped recent */}
              {Object.entries(grouped).map(([label, groupChats]) => (
                <div key={label} className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wide">
                    {label}
                  </p>
                  {groupChats.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      active={chat.id === activeChatId}
                      onDelete={handleDelete}
                      onTogglePin={togglePin}
                      onRename={renameChat}
                    />
                  ))}
                </div>
              ))}

              {chats.length === 0 && (
                <p className="text-xs text-muted-foreground px-3 py-4 text-center">
                  No chats yet
                </p>
              )}
            </ScrollArea>

            {/* Auth Footer */}
            <div className="p-3 border-t border-border mt-auto">
              {user ? (
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {user.email?.[0]?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className="text-sm text-muted-foreground truncate max-w-[120px]"
                      title={user.email}
                    >
                      {user.email}
                    </span>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full"
                  variant="default"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}

      {/* Collapsed Icons */}
      {collapsed && (
        <div className="flex flex-col items-center gap-2 px-2 py-2 flex-1">
            {/* Search */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              onClick={onOpenSearch}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* New Chat */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={handleNewChat}
            >
              <Plus className="h-5 w-5" />
            </Button>

            {/* User Avatar / Sign In */}
            <div className="mt-auto">
              {user ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={handleLogout}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {user.email?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  onClick={() => router.push("/login")}
                  title="Sign In"
                >
                  <LogIn className="h-5 w-5" />
                </Button>
              )}
            </div>
        </div>
      )}

    </motion.aside>
  )
}
