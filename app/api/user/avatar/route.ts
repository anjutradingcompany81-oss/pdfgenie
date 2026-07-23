import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AVATARS_DIR, ensureAvatarsDir } from "@/lib/uploads";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Use a PNG, JPG, or WebP image." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image must be under 2MB." }, { status: 400 });
  }

  await ensureAvatarsDir();
  const filename = `${session.user.id}-${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(AVATARS_DIR, filename), buffer);

  const imageUrl = `/api/uploads/avatars/${filename}`;
  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: imageUrl },
  });

  return NextResponse.json({ ok: true, image: imageUrl });
}
