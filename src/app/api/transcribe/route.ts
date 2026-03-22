import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"
import { createClient } from "@/lib/supabase/server"

const groq = new Groq()

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const audio = formData.get("audio") as Blob

    if (!audio) {
      return NextResponse.json(
        { error: "No audio provided", code: "NO_AUDIO" },
        { status: 400 }
      )
    }

    // Limit audio size to 25MB
    if (audio.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Audio file too large (max 25MB)", code: "FILE_TOO_LARGE" },
        { status: 400 }
      )
    }

    const arrayBuffer = await audio.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const file = new File([buffer], "audio.webm", { type: audio.type })

    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3-turbo",
      response_format: "json",
      language: "en",
    })

    const rawText = transcription.text as string
    return NextResponse.json({ text: rawText.trim(), raw: rawText.trim() })
  } catch (err) {
    console.error("Transcription error:", err)
    return NextResponse.json(
      { error: "Transcription failed", code: "TRANSCRIPTION_ERROR" },
      { status: 500 }
    )
  }
}
