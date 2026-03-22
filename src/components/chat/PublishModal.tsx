"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { generateSlug } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Copy, Check } from "lucide-react"

interface Props {
  chatId: string
  chatTitle: string
  onClose: () => void
}

export default function PublishModal({ chatId, chatTitle, onClose }: Props) {
  const [description, setDescription] = useState("")
  const [allowFork, setAllowFork] = useState(true)
  const [loading, setLoading] = useState(false)
  const [published, setPublished] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handlePublish = async () => {
    setLoading(true)
    const slug = generateSlug(chatTitle ?? "chat")

    const { error } = await supabase
      .from("published_chats")
      .upsert(
        {
          chat_id: chatId,
          slug,
          title: chatTitle ?? "Untitled Chat",
          description: description || null,
          allow_fork: allowFork,
        },
        { onConflict: "chat_id" },
      )

    if (!error) {
      setPublished(`${window.location.origin}/p/${slug}`)
    }
    setLoading(false)
  }

  const handleCopy = async () => {
    if (published) {
      await navigator.clipboard.writeText(published)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish Chat</DialogTitle>
          <DialogDescription>
            Share your conversation publicly with a unique link.
          </DialogDescription>
        </DialogHeader>

        {published ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your chat is now public at:
            </p>
            <div className="flex items-center gap-2 bg-secondary rounded-lg p-3">
              <p className="text-sm flex-1 truncate font-mono">{published}</p>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What's this chat about?"
              />
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="allowFork"
                checked={allowFork}
                onCheckedChange={(checked) => setAllowFork(checked as boolean)}
              />
              <Label htmlFor="allowFork" className="text-sm font-normal">
                Allow others to fork and continue this chat
              </Label>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handlePublish} disabled={loading}>
                {loading ? "Publishing..." : "Publish"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
