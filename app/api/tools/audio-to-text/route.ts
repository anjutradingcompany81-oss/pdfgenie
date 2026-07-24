import { NextResponse } from "next/server";

export const runtime = "nodejs";

const WHISPER_URL = "http://127.0.0.1:5006/transcribe";
const MAX_BYTES = 100 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("audio");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No audio file provided." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `That file is too large — the limit is ${MAX_BYTES / (1024 * 1024)}MB.` },
      { status: 400 }
    );
  }

  try {
    const forward = new FormData();
    forward.append("audio", file, file.name);

    const res = await fetch(WHISPER_URL, { method: "POST", body: forward });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Transcription failed." }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Transcription service is unavailable right now." }, { status: 503 });
  }
}
