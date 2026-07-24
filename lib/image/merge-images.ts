export type MergeDirection = "vertical" | "horizontal";

export async function mergeImages(files: File[], direction: MergeDirection): Promise<Blob> {
  const bitmaps = await Promise.all(files.map((f) => createImageBitmap(f)));

  const canvas = document.createElement("canvas");
  if (direction === "vertical") {
    canvas.width = Math.max(...bitmaps.map((b) => b.width));
    canvas.height = bitmaps.reduce((sum, b) => sum + b.height, 0);
  } else {
    canvas.width = bitmaps.reduce((sum, b) => sum + b.width, 0);
    canvas.height = Math.max(...bitmaps.map((b) => b.height));
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't supported here.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let offset = 0;
  for (const bitmap of bitmaps) {
    if (direction === "vertical") {
      ctx.drawImage(bitmap, 0, offset);
      offset += bitmap.height;
    } else {
      ctx.drawImage(bitmap, offset, 0);
      offset += bitmap.width;
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Couldn't create the merged image."));
    }, "image/png");
  });
}
