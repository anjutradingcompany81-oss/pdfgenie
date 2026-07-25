import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import nodemailer from "nodemailer";
import { clientIp, isThrottled } from "@/lib/rate-limit";

export const runtime = "nodejs";

const THROTTLE_MAX = 5;
const THROTTLE_WINDOW_MS = 60 * 1000;
const CONNECTION_TIMEOUT_MS = 8000;

// Letting a client make this server open an arbitrary TCP connection to any
// host:port is an SSRF / internal-port-scan primitive, so every resolved
// address is checked against loopback/private/link-local ranges before
// nodemailer ever touches it.
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true; // malformed — reject closed
  const [a, b] = parts;
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local
  if (a === 0) return true; // 0.0.0.0/8
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1") return true; // loopback
  if (normalized.startsWith("fe80:")) return true; // link-local
  // Unique local addresses, fc00::/7 — first byte is 0xfc or 0xfd.
  const firstGroup = normalized.split(":")[0];
  if (/^f[cd][0-9a-f]{2}$/.test(firstGroup)) return true;
  // IPv4-mapped (::ffff:a.b.c.d) — check the embedded IPv4 address too.
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
}

// Major providers reject a regular account password for SMTP once 2FA (or
// their own "less secure app" policy) is involved, and their raw rejection
// text doesn't say so in plain language — point the user at the fix instead
// of just relaying Google/Microsoft/Yahoo's own error string.
const APP_PASSWORD_HINTS: { hostIncludes: string; messagePattern: RegExp; hint: string }[] = [
  {
    hostIncludes: "gmail.com",
    messagePattern: /BadCredentials|Username and Password not accepted/i,
    hint: "Gmail no longer accepts your regular password for SMTP. Turn on 2-Step Verification, then generate an App Password at myaccount.google.com/apppasswords and use that instead.",
  },
  {
    hostIncludes: "smtp-mail.outlook.com",
    messagePattern: /Authentication unsuccessful|5\.7\.3|5\.7\.57/i,
    hint: "Outlook.com/Hotmail no longer accepts your regular password for SMTP. Turn on 2-step verification, then generate an app password at account.live.com/proofs/AppPassword and use that instead.",
  },
  {
    hostIncludes: "office365.com",
    messagePattern: /5\.7\.139|basic auth|BasicAuth|SmtpClientAuthentication/i,
    hint: "This Microsoft 365 (work/school) account has Basic Authentication disabled for SMTP — Microsoft retired regular-password SMTP login for these accounts. Ask your admin to enable SMTP AUTH for this mailbox, or use a personal outlook.com/hotmail.com account instead, which supports an app password.",
  },
  {
    hostIncludes: "yahoo.com",
    messagePattern: /Invalid login|authentication failed/i,
    hint: "Yahoo Mail requires an app password for SMTP, not your regular password. Generate one at Yahoo Account Security → Generate app password.",
  },
];

function friendlyAuthError(host: string, rawMessage: string): string {
  const match = APP_PASSWORD_HINTS.find((h) => host.includes(h.hostIncludes) && h.messagePattern.test(rawMessage));
  return match ? match.hint : rawMessage;
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (isThrottled(`verify-smtp:${ip}`, THROTTLE_MAX, THROTTLE_WINDOW_MS)) {
    return NextResponse.json({ error: "Too many verification attempts — please wait a minute." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const host = typeof body?.host === "string" ? body.host.trim() : "";
  const port = Number(body?.port) || 587;
  const secure = Boolean(body?.secure);
  const user = typeof body?.user === "string" ? body.user : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!host || !user || !password) {
    return NextResponse.json({ ok: false, error: "Host, username, and password are required." }, { status: 400 });
  }

  let resolved;
  try {
    resolved = await lookup(host);
  } catch {
    return NextResponse.json({ ok: false, error: "Couldn't resolve that SMTP host." }, { status: 400 });
  }

  const isPrivate = resolved.family === 4 ? isPrivateIPv4(resolved.address) : isPrivateIPv6(resolved.address);
  if (isPrivate) {
    return NextResponse.json({ ok: false, error: "That host isn't a reachable public SMTP server." }, { status: 400 });
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass: password },
    connectionTimeout: CONNECTION_TIMEOUT_MS,
    greetingTimeout: CONNECTION_TIMEOUT_MS,
    socketTimeout: CONNECTION_TIMEOUT_MS,
  });

  try {
    await transport.verify();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : "Couldn't connect with those settings.";
    return NextResponse.json({
      ok: false,
      error: friendlyAuthError(host, rawMessage),
    });
  }
}
