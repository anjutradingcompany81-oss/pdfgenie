import { NextResponse } from "next/server";
import { parseRecipientsFile } from "@/lib/mail-merge/parse-recipients";
import { resolveIdentity } from "@/lib/mail-merge/resolve-identity";
import { PLAN_LIMITS } from "@/lib/plans/config";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("excel");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const { plan } = await resolveIdentity();
  const limits = PLAN_LIMITS[plan];

  if (limits.maxExcelSizeMb !== -1 && file.size > limits.maxExcelSizeMb * 1024 * 1024) {
    return NextResponse.json(
      { error: `The free plan allows Excel files up to ${limits.maxExcelSizeMb}MB.` },
      { status: 400 }
    );
  }

  try {
    const buffer = await file.arrayBuffer();
    const { recipients, columns } = parseRecipientsFile(buffer);

    if (limits.maxEmailsPerJob !== -1 && recipients.length > limits.maxEmailsPerJob) {
      return NextResponse.json(
        {
          error: `The free plan allows up to ${limits.maxEmailsPerJob} emails per mail merge job. Your file has ${recipients.length} recipients.`,
          limitReached: true,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      recipients: recipients.map((r) => ({ email: r.email, fields: r.fields })),
      columns,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Couldn't read that file." },
      { status: 400 }
    );
  }
}
