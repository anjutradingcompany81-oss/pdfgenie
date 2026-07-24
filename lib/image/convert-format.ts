export type ImageMime = "image/png" | "image/jpeg" | "image/webp";

export async function convertImageFormat(file: File, mime: ImageMime, quality = 0.92): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't supported here.");

  if (mime === "image/jpeg") {
    // JPEG has no alpha channel — flatten onto white first so transparency doesn't turn black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Couldn't convert that image."));
      },
      mime,
      mime === "image/png" ? undefined : quality
    );
  });
}
