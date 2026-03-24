"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { Chat } from "@/types"

const PAGE_SIZE = 20

export function useChatList() {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [creatingChat, setCreatingChat] = useState(false)
  const cursorRef = useRef<string | null>(null)

  const fetchChats = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setChats([])
      setLoading(false)
      setHasMore(false)
      return
    }

    setLoading(true)
    const { data } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(PAGE_SIZE)

    const fetched = data ?? []
    setChats(fetched)
    setHasMore(fetched.length === PAGE_SIZE)
    cursorRef.current =
      fetched.length > 0 ? fetched[fetched.length - 1].updated_at : null
    setLoading(false)
  }, [])

  const fetchMoreChats = useCallback(async () => {
    if (loadingMore || !hasMore) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || !cursorRef.current) return

    setLoadingMore(true)
    const { data } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .lt("updated_at", cursorRef.current)
      .limit(PAGE_SIZE)

    const fetched = data ?? []
    setChats((prev) => [...prev, ...fetched])
    setHasMore(fetched.length === PAGE_SIZE)
    cursorRef.current =
      fetched.length > 0 ? fetched[fetched.length - 1].updated_at : null
    setLoadingMore(false)
  }, [loadingMore, hasMore])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        setChats([])
        cursorRef.current = null
      }
      fetchChats()
    })

    fetchChats()

    const channel = supabase
      .channel("chats-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        () => {
          fetchChats()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [fetchChats])

  const createChat = async (): Promise<{
    id: string | null
    error?: string
  }> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { id: null, error: "Must be logged in to create a chat" }
    }

    setCreatingChat(true)

    try {
      const res = await fetch("/api/chat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      if (!res.ok) {
        const data = await res.json()
        return { id: null, error: data.error ?? "Failed to create chat" }
      }

      const data = await res.json()
      return { id: data.id }
    } finally {
      setCreatingChat(false)
    }
  }

  const deleteChat = async (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id))
    await supabase.from("chats").delete().eq("id", id)
  }

  const togglePin = async (id: string, is_pinned: boolean) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_pinned: !is_pinned } : c))
    )
    await supabase
      .from("chats")
      .update({ is_pinned: !is_pinned })
      .eq("id", id)
  }

  const renameChat = async (id: string, title: string) => {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    )
    await supabase.from("chats").update({ title }).eq("id", id)
  }

  return {
    chats,
    loading,
    loadingMore,
    hasMore,
    creatingChat,
    fetchMoreChats,
    createChat,
    deleteChat,
    togglePin,
    renameChat,
    refetch: fetchChats,
  }
}
