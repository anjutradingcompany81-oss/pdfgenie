import { NextRequest, NextResponse } from "next/server";
import { getJobIfAccessible } from "@/lib/mail-merge/job-access";
import { getJobLogRows, logFilename, logToXlsx, logToCsv, logToJson, logToPdf } from "@/lib/mail-merge/logs";

const CONTENT_TYPES: Record<string, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  json: "application/json",
  pdf: "application/pdf",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await getJobIfAccessible(id);
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const format = (request.nextUrl.searchParams.get("format") || "xlsx").toLowerCase();
  if (!(format in CONTENT_TYPES)) {
    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  }

  const data = await getJobLogRows(id);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Buffer | Uint8Array | string;
  if (format === "xlsx") body = logToXlsx(data.rows);
  else if (format === "csv") body = logToCsv(data.rows);
  else if (format === "json") body = logToJson(data.rows);
  else body = await logToPdf(data.rows);

  const filename = logFilename(format);
  return new NextResponse(body as BodyInit, {
    headers: {
      "Content-Type": CONTENT_TYPES[format],
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
