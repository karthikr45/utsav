import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireUser, AppError } from "@/server/auth";
import { businessAccess } from "@/server/policy";
import { database } from "@/server/db";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const origin = req.headers.get("origin");
    if (
      origin &&
      origin !== req.nextUrl.origin &&
      origin !== process.env.APP_ORIGIN
    )
      throw new AppError(403, "Request origin is not allowed.");
    if (Number(req.headers.get("content-length") || 0) > 5500000)
      throw new AppError(413, "Documents must be smaller than 5 MB.");
    const form = await req.formData();
    const businessId = String(form.get("business_id") || "");
    await businessAccess(user, businessId, "manage");
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 5000000 || file.size === 0)
      throw new AppError(400, "Choose a PDF, PNG or JPEG smaller than 5 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const valid =
      (file.type === "application/pdf" &&
        bytes.subarray(0, 5).toString() === "%PDF-") ||
      (file.type === "image/png" &&
        bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
      (file.type === "image/jpeg" &&
        bytes[0] === 255 &&
        bytes[1] === 216 &&
        bytes[2] === 255);
    if (!valid)
      throw new AppError(
        400,
        "Only valid PDF, PNG and JPEG files are accepted.",
      );
    const id = randomUUID();
    const directory = path.join(process.cwd(), ".data/documents");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, id), bytes, {
      flag: "wx",
      mode: 0o600,
    });
    const db = await database();
    await db.transaction(async (tx) => {
      await tx.query(
        "INSERT INTO documents(id,business_id,uploaded_by,name,mime,size) VALUES($1,$2,$3,$4,$5,$6)",
        [
          id,
          businessId,
          user.id,
          path.basename(file.name).slice(0, 150),
          file.type,
          file.size,
        ],
      );
      await tx.query(
        "INSERT INTO audit(id,actor_id,action,entity_id) VALUES($1,$2,$3,$4)",
        [randomUUID(), user.id, "document.upload", id],
      );
    });
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof AppError ? e.message : "Unable to upload the document.",
      },
      { status: e instanceof AppError ? e.status : 500 },
    );
  }
}
