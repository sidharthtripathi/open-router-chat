"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import HomeView from "@/components/chat/HomeView"
import Sidebar from "@/components/chat/Sidebar"
import SearchModal from "@/components/chat/SearchModal"

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <HomeView user={user} />
      </main>

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </div>
  )
}
