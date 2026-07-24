import { NextResponse } from "next/server";
import { clientIp, isThrottled } from "@/lib/rate-limit";

export const runtime = "nodejs";

const LIBRETRANSLATE_URL = "http://127.0.0.1:5005/translate";
const MAX_CHARS = 5000;
const THROTTLE_MAX = 30;
const THROTTLE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  if (isThrottled(`translate:${clientIp(request)}`, THROTTLE_MAX, THROTTLE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many translation requests from this connection — please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text : "";
  const source = typeof body?.source === "string" ? body.source : "";
  const target = typeof body?.target === "string" ? body.target : "";

  if (!text.trim() || !source || !target) {
    return NextResponse.json({ error: "Missing text, source, or target language." }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json({ error: `Text is too long — the limit is ${MAX_CHARS} characters.` }, { status: 400 });
  }

  try {
    const res = await fetch(LIBRETRANSLATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source, target, format: "text" }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Translation failed." }, { status: 500 });
    }
    return NextResponse.json({ translatedText: data.translatedText });
  } catch {
    return NextResponse.json({ error: "Translation service is unavailable right now." }, { status: 503 });
  }
}
