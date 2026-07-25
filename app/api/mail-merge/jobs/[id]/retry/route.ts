import { NextRequest, NextResponse } from "next/server";
import { getJobIfAccessible } from "@/lib/mail-merge/job-access";
import { retryFailedRecipients } from "@/lib/mail-merge/retry";
import { parseSmtpConfig } from "@/lib/mail-merge/parse-smtp-config";

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
  if ("blocked" in result) {
    return NextResponse.json(
      { error: "This job is still actively sending — wait for it to finish or pause it first." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, ...result });
}
