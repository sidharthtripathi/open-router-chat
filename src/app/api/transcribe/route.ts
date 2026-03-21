import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as Blob;

    if (!audio) {
      return NextResponse.json(
        { error: "No audio provided", code: "NO_AUDIO" },
        { status: 400 },
      );
    }

    // Convert blob to buffer
    const arrayBuffer = await audio.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a temporary file-like object for the API
    const file = new File([buffer], "audio.webm", { type: audio.type });

    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3-turbo",
      response_format: "json",
      language: "en",
    });

    const rawText = transcription.text as string;

    return NextResponse.json({ text: rawText.trim(), raw: rawText.trim() });
  } catch (err) {
    console.error("Transcription error:", err);
    return NextResponse.json(
      { error: "Transcription failed", code: "TRANSCRIPTION_ERROR" },
      { status: 500 },
    );
  }
}
