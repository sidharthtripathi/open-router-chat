"use client"

import { useVoice } from "@/hooks/useVoice"
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from "lucide-react"

interface Props {
  onTranscript: (text: string) => void
}

export default function VoiceButton({ onTranscript }: Props) {
  const { state, startRecording, stopRecording } = useVoice(onTranscript)

  if (state === "processing") {
    return (
      <Button variant="ghost" size="icon" disabled className="text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </Button>
    )
  }

  if (state === "recording") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={stopRecording}
        className="text-destructive"
      >
        <MicOff className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={startRecording}
      className="text-muted-foreground hover:text-foreground"
    >
      <Mic className="h-5 w-5" />
    </Button>
  )
}
