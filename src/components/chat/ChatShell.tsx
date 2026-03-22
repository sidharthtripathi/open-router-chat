"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import SearchModal from "./SearchModal"
import { useChatList } from "@/hooks/useChatList"

interface Props {
  children: React.ReactNode
}

export default function ChatShell({ children }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const { chats } = useChatList()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
      />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        chats={chats}
      />
    </div>
  )
}
