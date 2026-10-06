import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { query, demoMode } from "@/server/db";
import {
  currentUser,
  requireUser,
  createSession,
  logout,
  AppError,
} from "@/server/auth";
import { hashPassword, verifyPassword } from "@/server/password";
import { catalog, workspace, command } from "@/server/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function dispatch(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await context.params;
    const route = path.join("/");
    if (req.method === "GET") {
      if (route === "catalog") return NextResponse.json(await catalog());
      if (route === "auth/me")
        return NextResponse.json({
          user: await currentUser(),
          demo: demoMode(),
        });
      if (route === "workspace")
        return NextResponse.json(await workspace(await requireUser()));
      throw new AppError(404, "Endpoint not found.");
    }
    const origin = req.headers.get("origin");
    const allowed = new Set(
      [req.nextUrl.origin, process.env.APP_ORIGIN].filter(Boolean),
    );
    if (origin && !allowed.has(origin))
      throw new AppError(403, "Request origin is not allowed.");
    const raw = await req.text();
    if (raw.length > 25000) throw new AppError(413, "Request too large.");
    const body = JSON.parse(raw || "{}");
    if (route === "auth/logout") {
      await logout();
      return NextResponse.json({ ok: true });
    }
    if (route === "auth/login" || route === "auth/register") {
      const d = z
        .object({
          email: z.email().transform((v) => v.toLowerCase()),
          password: z.string().min(12).max(128),
          name: z.string().trim().min(2).max(100).optional(),
        })
        .parse(body);
      const attempts = await query(
        "SELECT * FROM auth_attempts WHERE email=$1",
        [d.email],
      );
      if (
        attempts[0]?.attempts >= 8 &&
        Date.now() - new Date(attempts[0].updated_at).getTime() < 900000
      )
        throw new AppError(429, "Too many attempts. Try again in 15 minutes.");
      let user;
      if (route === "auth/register") {
        if (!d.name) throw new AppError(400, "Please enter your name.");
        if (
          (await query("SELECT id FROM users WHERE email=$1", [d.email])).length
        )
          throw new AppError(409, "An account already exists. Please sign in.");
        user = { id: randomUUID() };
        await query(
          "INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4)",
          [user.id, d.name, d.email, hashPassword(d.password)],
        );
      } else {
        user = (
          await query("SELECT * FROM users WHERE email=$1", [d.email])
        )[0];
        const valid = verifyPassword(
          d.password,
          user?.password_hash ?? hashPassword("invalid-password-placeholder"),
        );
        if (!user || !valid) {
          await query(
            "INSERT INTO auth_attempts(email,attempts) VALUES($1,1) ON CONFLICT(email) DO UPDATE SET attempts=CASE WHEN auth_attempts.updated_at<now()-interval '15 minutes' THEN 1 ELSE auth_attempts.attempts+1 END,updated_at=now()",
            [d.email],
          );
          throw new AppError(401, "Email or password is incorrect.");
        }
      }
      await query("DELETE FROM auth_attempts WHERE email=$1", [d.email]);
      await createSession(user.id);
      return NextResponse.json({ ok: true });
    }
    if (route === "commands") {
      const d = z.object({ action: z.string(), data: z.unknown() }).parse(body);
      return NextResponse.json(
        await command(await requireUser(), d.action, d.data),
      );
    }
    throw new AppError(404, "Endpoint not found.");
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    if (error instanceof z.ZodError)
      return NextResponse.json(
        {
          error: error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        { status: 400 },
      );
    if (error instanceof SyntaxError)
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    const pg = error as { code?: string };
    if (pg.code === "23505")
      return NextResponse.json(
        {
          error:
            "This action conflicts with an existing record. Please refresh.",
        },
        { status: 409 },
      );
    console.error("API error", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
export const GET = dispatch;
export const POST = dispatch;
