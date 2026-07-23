import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { AVATARS_DIR } from "@/lib/uploads";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

// Filenames are always generated as `${userId}-${uuid}.${ext}` by the
// upload route — reject anything else outright (blocks path traversal).
const SAFE_FILENAME = /^[a-zA-Z0-9_-]+\.(png|jpg|webp)$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  if (!SAFE_FILENAME.test(filename)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = filename.split(".").pop() as string;

  try {
    const buffer = await readFile(path.join(AVATARS_DIR, filename));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext],
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
