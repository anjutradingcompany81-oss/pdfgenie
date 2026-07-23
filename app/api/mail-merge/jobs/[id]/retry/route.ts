import { NextRequest, NextResponse } from "next/server";
import { getJobIfAccessible } from "@/lib/mail-merge/job-access";
import { retryFailedRecipients } from "@/lib/mail-merge/retry";
import type { TransientSmtpConfig } from "@/lib/mail-merge/send-job";

function parseSmtpConfig(raw: FormDataEntryValue | null): TransientSmtpConfig | undefined {
  if (typeof raw !== "string" || !raw) return undefined;
  try {
    const data = JSON.parse(raw);
    if (!data?.useCustom) return undefined;
    if (!data.host || !data.user || !data.password || !data.fromEmail) return undefined;
    return {
      host: String(data.host),
      port: Number(data.port) || 587,
      secure: Boolean(data.secure),
      user: String(data.user),
      password: String(data.password),
      fromEmail: String(data.fromEmail),
      fromName: data.fromName ? String(data.fromName) : undefined,
    };
  } catch {
    return undefined;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await getJobIfAccessible(id);
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const attachmentFiles = formData.getAll("attachments").filter((f): f is File => f instanceof File);
  const smtpConfig = parseSmtpConfig(formData.get("smtpConfig"));

  const attachments = await Promise.all(
    attachmentFiles.map(async (f) => ({
      filename: f.name,
      content: Buffer.from(await f.arrayBuffer()),
    }))
  );

  const result = await retryFailedRecipients(id, attachments, smtpConfig);
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...result });
}
