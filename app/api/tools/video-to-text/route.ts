import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const runtime = "nodejs";

const WHISPER_URL = "http://127.0.0.1:5006/transcribe";
const MAX_BYTES = 300 * 1024 * 1024;

function extractAudio(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-i", inputPath,
      "-vn",
      "-acodec", "pcm_s16le",
      "-ar", "16000",
      "-ac", "1",
      outputPath,
    ]);
    let stderr = "";
    ffmpeg.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`));
    });
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("video");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No video file provided." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `That file is too large — the limit is ${MAX_BYTES / (1024 * 1024)}MB.` },
      { status: 400 }
    );
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "pdfgenie-v2t-"));
  const ext = path.extname(file.name) || ".mp4";
  const inputPath = path.join(workDir, `input${ext}`);
  const audioPath = path.join(workDir, "audio.wav");

  try {
    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));
    await extractAudio(inputPath, audioPath);

    const audioBuffer = await readFile(audioPath);
    const forward = new FormData();
    forward.append("audio", new Blob([new Uint8Array(audioBuffer)]), "audio.wav");

    const res = await fetch(WHISPER_URL, { method: "POST", body: forward });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Transcription failed." }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Couldn't process that video — it may be corrupted or an unsupported format." },
      { status: 500 }
    );
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
