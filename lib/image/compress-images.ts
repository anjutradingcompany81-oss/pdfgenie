export type CompressFormat = "image/jpeg" | "image/webp" | "image/png";

export const FORMAT_EXTENSION: Record<CompressFormat, string> = {
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/png": "png",
};

export async function compressImage(
  file: File,
  quality: number,
  format: CompressFormat
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't supported here.");
  ctx.drawImage(bitmap, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Couldn't compress that image."));
      },
      format,
      format === "image/png" ? undefined : quality
    );
  });
}
