import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
    />
  )
}

export function ChatListSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2">
          <Skeleton className="h-4 w-4 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-3/4 rounded" />
            <Skeleton className="h-2 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChatPageSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-32 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 overflow-hidden p-4 space-y-4">
        {/* User message skeleton */}
        <div className="flex justify-end">
          <div className="max-w-[60%] space-y-2">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-3 w-16 rounded ml-auto" />
          </div>
        </div>

        {/* Assistant message skeleton */}
        <div className="flex justify-start">
          <div className="max-w-[75%] space-y-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-4/6 rounded" />
          </div>
        </div>

        {/* Another assistant message */}
        <div className="flex justify-start">
          <div className="max-w-[75%] space-y-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
        </div>
      </div>

      {/* Input area skeleton */}
      <div className="shrink-0 p-4">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-12 w-full rounded-[32px]" />
        </div>
      </div>
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[75%] space-y-2">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-4/5 rounded" />
      </div>
    </div>
  )
}

export function Spinner({ className }: SkeletonProps) {
  return (
    <svg
      className={cn("animate-spin h-4 w-4", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
