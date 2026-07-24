export async function resizeImage(
  file: File,
  width: number,
  height: number,
  quality = 0.92
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't supported here.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Couldn't resize that image."));
      },
      mime,
      mime === "image/png" ? undefined : quality
    );
  });
}
