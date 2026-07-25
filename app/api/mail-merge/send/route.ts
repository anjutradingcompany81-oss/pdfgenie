import { NextResponse } from "next/server";
import { parseRecipientsFile } from "@/lib/mail-merge/parse-recipients";
import { validateAndSend } from "@/lib/mail-merge/send-job";
import { parseSmtpConfig } from "@/lib/mail-merge/parse-smtp-config";
import { resolveIdentity } from "@/lib/mail-merge/resolve-identity";
import { isRateLimited, recordFailedAttempt } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { userId, identifier, plan } = await resolveIdentity();

  // Anonymous senders get an extra request-rate guard on top of the daily
  // email quota, since they have no account to disable.
  if (identifier.type === "ANONYMOUS" && isRateLimited(`mail-merge:${identifier.id}`)) {
    return NextResponse.json(
      { error: "Too many mail merge jobs from this browser. Try again later." },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const excelFile = formData.get("excel");
  const subject = formData.get("subject");
  const body = formData.get("body");
  const attachmentFiles = formData.getAll("attachments").filter((f): f is File => f instanceof File);
  const smtpConfig = parseSmtpConfig(formData.get("smtpConfig"));

  if (!(excelFile instanceof File) || typeof subject !== "string" || typeof body !== "string") {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!subject.trim() || !body.trim()) {
    return NextResponse.json({ error: "Subject and body can't be empty." }, { status: 400 });
  }

  let recipients;
  try {
    const buffer = await excelFile.arrayBuffer();
    ({ valid: recipients } = parseRecipientsFile(buffer));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Couldn't read that file." },
      { status: 400 }
    );
  }

  const attachments = await Promise.all(
    attachmentFiles.map(async (f) => ({
      filename: f.name,
      content: Buffer.from(await f.arrayBuffer()),
    }))
  );

  const result = await validateAndSend({
    identifier,
    userId,
    plan,
    subjectTemplate: subject,
    bodyTemplate: body,
    recipients,
    attachments,
    excelSizeBytes: excelFile.size,
    smtpConfig,
  });

  if (!result.ok) {
    if (identifier.type === "ANONYMOUS") recordFailedAttempt(`mail-merge:${identifier.id}`);
    return NextResponse.json({ error: result.reason, limitReached: true }, { status: 400 });
  }

  return NextResponse.json(result);
}
