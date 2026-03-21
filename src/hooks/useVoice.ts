"use client";

import { useCallback, useRef, useState } from "react";

type VoiceState = "idle" | "recording" | "processing";

// Cross-browser MIME type support
function getSupportedMimeType(): string {
  const mimeTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
    "audio/ogg",
  ];

  for (const type of mimeTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "audio/webm"; // fallback
}

export function useVoice(onTranscript: (text: string) => void) {
  const [state, setState] = useState<VoiceState>("idle");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("");

  const startRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mimeTypeRef.current = getSupportedMimeType();
    const recorder = new MediaRecorder(stream, {
      mimeType: mimeTypeRef.current,
    });

    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = async () => {
      setState("processing");

      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
      const extension = mimeTypeRef.current.includes("mp4") ? "mp4" : "webm";
      const formData = new FormData();
      formData.append("audio", blob, `audio.${extension}`);

      try {
        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.text) {
          onTranscript(data.text);
        } else if (data.error) {
          console.error("Transcription API error:", data.error);
        }
      } catch (err) {
        console.error("Transcription error:", err);
      } finally {
        setState("idle");
        stream.getTracks().forEach((t) => t.stop());
      }
    };

    mediaRef.current = recorder;
    recorder.start(1000); // Collect data every second
    setState("recording");
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRef.current?.state === "recording") {
      mediaRef.current.stop();
    }
  }, []);

  return { state, startRecording, stopRecording };
}
