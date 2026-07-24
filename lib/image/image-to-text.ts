import { createWorker } from "tesseract.js";

export type OcrImageProgress = { status: string; progress: number };

export async function imageToText(
  file: File,
  onProgress?: (p: OcrImageProgress) => void
): Promise<string> {
  const worker = await createWorker("eng", undefined, {
    logger: (m) => {
      if (m.status === "recognizing text") {
        onProgress?.({ status: m.status, progress: m.progress });
      }
    },
  });

  try {
    const { data } = await worker.recognize(file);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
