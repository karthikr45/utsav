import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireUser, AppError } from "@/server/auth";
import { businessAccess } from "@/server/policy";
import { query } from "@/server/db";
export const runtime = "nodejs";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const d = (await query("SELECT * FROM documents WHERE id=$1", [id]))[0];
    if (!d) throw new AppError(404, "Document not found.");
    if (!["admin", "reviewer"].includes(user.role))
      await businessAccess(user, d.business_id, "manage");
    const bytes = await readFile(
      path.join(process.cwd(), ".data/documents", d.id),
    );
    return new Response(bytes, {
      headers: {
        "Content-Type": d.mime,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(d.name)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof AppError
            ? e.message
            : "Unable to download this document.",
      },
      { status: e instanceof AppError ? e.status : 500 },
    );
  }
}
