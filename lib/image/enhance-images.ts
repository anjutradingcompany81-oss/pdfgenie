export type EnhanceOptions = {
  brightness: number; // 100 = unchanged
  contrast: number;
  saturate: number;
  sharpen: boolean;
};

export async function enhanceImage(file: File, opts: EnhanceOptions): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't supported here.");

  ctx.filter = `brightness(${opts.brightness}%) contrast(${opts.contrast}%) saturate(${opts.saturate}%)`;
  ctx.drawImage(bitmap, 0, 0);
  ctx.filter = "none";

  if (opts.sharpen) {
    sharpen(ctx, canvas.width, canvas.height);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Couldn't process that image."));
    }, "image/png");
  });
}

// Simple unsharp-mask style 3x3 convolution kernel.
const KERNEL = [0, -1, 0, -1, 5, -1, 0, -1, 0];

function sharpen(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const src = ctx.getImageData(0, 0, width, height);
  const dst = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const sy = Math.min(height - 1, Math.max(0, y + ky - 1));
          const sx = Math.min(width - 1, Math.max(0, x + kx - 1));
          const weight = KERNEL[ky * 3 + kx];
          const idx = (sy * width + sx) * 4;
          r += src.data[idx] * weight;
          g += src.data[idx + 1] * weight;
          b += src.data[idx + 2] * weight;
        }
      }
      const dstIdx = (y * width + x) * 4;
      dst.data[dstIdx] = clamp(r);
      dst.data[dstIdx + 1] = clamp(g);
      dst.data[dstIdx + 2] = clamp(b);
      dst.data[dstIdx + 3] = src.data[dstIdx + 3];
    }
  }
  ctx.putImageData(dst, 0, 0);
}

function clamp(v: number): number {
  return Math.min(255, Math.max(0, v));
}
