import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { query } from "./db";
import type { User } from "@/lib/types";
import { AppError } from "./errors";
export { AppError } from "./errors";
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get("utsav_session")?.value;
  if (!token) return null;
  const rows = await query<User>(
    "SELECT u.id,u.name,u.email,u.role,u.city FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()",
    [digest(token)],
  );
  return rows[0] ?? null;
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new AppError(401, "Please sign in to continue.");
  return user;
}
export async function createSession(id: string) {
  const token = randomBytes(32).toString("hex");
  await query(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')",
    [digest(token), id],
  );
  (await cookies()).set("utsav_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.APP_ORIGIN?.startsWith("https://") ?? false,
    path: "/",
    maxAge: 604800,
  });
}
export async function logout() {
  const jar = await cookies();
  const token = jar.get("utsav_session")?.value;
  if (token)
    await query("DELETE FROM sessions WHERE token_hash=$1", [digest(token)]);
  jar.delete("utsav_session");
}
