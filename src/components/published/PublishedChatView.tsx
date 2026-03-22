import { Message, PublishedChat } from "@/types"
import ForkButton from "./ForkButton"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface Props {
  published: PublishedChat
  messages: Message[]
}

export default function PublishedChatView({ published, messages }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8 pb-6">
          <h1 className="text-2xl font-semibold mb-2">{published.title}</h1>
          {published.description && (
            <p className="text-muted-foreground text-sm mb-4">
              {published.description}
            </p>
          )}
          <div className="flex items-center gap-4">
            <p className="text-xs text-muted-foreground">
              {new Date(published.published_at).toLocaleDateString()}
            </p>
            {published.allow_fork && (
              <ForkButton publishedChatId={published.chat_id} />
            )}
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Messages */}
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {msg.image_urls?.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="max-w-full rounded-lg mb-2"
                  />
                ))}
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
