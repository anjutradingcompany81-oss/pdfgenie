import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const runtime = "nodejs";

const MAX_BYTES = 300 * 1024 * 1024; // matches nginx's client_max_body_size
const CRF_BY_QUALITY: Record<string, string> = {
  high: "20",
  balanced: "26",
  small: "32",
};

// Video compression can't run client-side the way every other tool in this
// app does (no free, fast, in-browser transcoder for arbitrary uploads) —
// this is the one tool that genuinely uploads the file to the server. It's
// still free (ffmpeg is open source, no API key, runs on our own VPS), but
// the "never uploaded anywhere" privacy note other tools show would be
// false here, so the page has its own honest copy instead.
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("video");
  const quality = String(formData.get("quality") ?? "balanced");
  const crf = CRF_BY_QUALITY[quality] ?? CRF_BY_QUALITY.balanced;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No video file provided." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `That file is too large — the limit is ${MAX_BYTES / (1024 * 1024)}MB.` },
      { status: 400 }
    );
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "pdfgenie-video-"));
  const ext = path.extname(file.name) || ".mp4";
  const inputPath = path.join(workDir, `input${ext}`);
  const outputPath = path.join(workDir, `output-${randomUUID()}.mp4`);

  try {
    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));

    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-y",
        "-i", inputPath,
        "-vcodec", "libx264",
        "-crf", crf,
        "-preset", "fast",
        "-acodec", "aac",
        "-movflags", "+faststart",
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

    const output = await readFile(outputPath);
    const baseName = file.name.replace(/\.[^.]+$/, "");

    return new NextResponse(new Uint8Array(output), {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${baseName}-compressed.mp4"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't compress that video — it may be corrupted or an unsupported format." },
      { status: 500 }
    );
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
