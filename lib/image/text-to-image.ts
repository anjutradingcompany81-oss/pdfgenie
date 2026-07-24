export type TextImageOptions = {
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  width: number;
};

const PADDING = 32;

export async function textToImage(text: string, opts: TextImageOptions): Promise<Blob> {
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  if (!measureCtx) throw new Error("Canvas isn't supported here.");

  const font = `${opts.fontSize}px system-ui, sans-serif`;
  measureCtx.font = font;
  const maxWidth = opts.width - PADDING * 2;
  const lineHeight = Math.round(opts.fontSize * 1.4);

  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    const words = paragraph.split(/\s+/).filter(Boolean);
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (current && measureCtx.measureText(candidate).width > maxWidth) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
  }

  const canvas = document.createElement("canvas");
  canvas.width = opts.width;
  canvas.height = Math.max(lineHeight, lines.length * lineHeight) + PADDING * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't supported here.");

  ctx.fillStyle = opts.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = opts.textColor;
  ctx.font = font;
  ctx.textBaseline = "top";
  lines.forEach((line, i) => {
    ctx.fillText(line, PADDING, PADDING + i * lineHeight);
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Couldn't create that image."));
    }, "image/png");
  });
}
