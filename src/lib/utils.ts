import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Chat } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(title: string): string {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40)

  const nanoid = Math.random().toString(36).slice(2, 8)
  return `${sanitized}-${nanoid}`
}

export function groupChatsByDate(chats: Chat[]): Record<string, Chat[]> {
  const now = new Date()
  const groups: Record<string, Chat[]> = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
    Older: [],
  }

  for (const chat of chats) {
    const date = new Date(chat.updated_at)
    const diffMs = now.getTime() - date.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffDays < 1) groups['Today'].push(chat)
    else if (diffDays < 2) groups['Yesterday'].push(chat)
    else if (diffDays < 7) groups['Previous 7 Days'].push(chat)
    else if (diffDays < 30) groups['Previous 30 Days'].push(chat)
    else groups['Older'].push(chat)
  }

  // Remove empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([, v]) => v.length > 0)
  )
}

// Simple token estimation: 1 token ≈ 4 chars
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function truncateMessages(
  messages: { role: string; content: string }[],
  maxTokens: number
): { role: string; content: string }[] {
  let total = 0
  const result = []

  for (let i = messages.length - 1; i >= 0; i--) {
    const tokens = estimateTokens(messages[i].content)
    if (total + tokens > maxTokens) break
    total += tokens
    result.unshift(messages[i])
  }

  return result
}
