import type { Database } from "./db";
import { database } from "./db";
import { AppError } from "./errors";
import type { User, Role } from "@/lib/types";
export function allowRole(user: User, roles: Role[]) {
  if (!roles.includes(user.role))
    throw new AppError(403, "Your role cannot perform this action.");
}
export function withinCity(user: User, city: string) {
  if (user.role === "operations" && user.city !== city)
    throw new AppError(403, "This event is outside your assigned city.");
}
export async function eventAccess(
  user: User,
  id: string,
  mode: "read" | "edit" | "approve" = "read",
  amount = 0,
  db?: Database,
) {
  const conn = db ?? (await database());
  const e = (await conn.query("SELECT * FROM events WHERE id=$1", [id]))
    .rows[0];
  if (!e) throw new AppError(404, "Event not found.");
  if (e.owner_id === user.id) return e;
  const member = (
    await conn.query(
      "SELECT * FROM event_members WHERE event_id=$1 AND user_id=$2",
      [id, user.id],
    )
  ).rows[0];
  if (
    member &&
    (mode === "read" ||
      (mode === "edit" && member.role !== "viewer") ||
      (mode === "approve" &&
        member.role === "approver" &&
        member.spending_limit >= amount))
  )
    return e;
  if (
    mode === "read" &&
    ["admin", "support", "finance", "operations"].includes(user.role)
  ) {
    withinCity(user, e.city);
    return e;
  }
  throw new AppError(403, "You do not have permission for this event.");
}
export async function businessAccess(
  user: User,
  id: string,
  mode: "read" | "manage" | "owner" = "read",
  db?: Database,
) {
  const conn = db ?? (await database());
  const member = (
    await conn.query(
      "SELECT * FROM business_members WHERE business_id=$1 AND user_id=$2",
      [id, user.id],
    )
  ).rows[0];
  if (
    member &&
    (mode === "read" ||
      (mode === "manage" && ["owner", "manager"].includes(member.role)) ||
      (mode === "owner" && member.role === "owner"))
  )
    return member;
  throw new AppError(403, "You do not have permission for this business.");
}
export async function quoteAccess(user: User, id: string, db?: Database) {
  const conn = db ?? (await database());
  const q = (await conn.query("SELECT * FROM quotes WHERE id=$1", [id]))
    .rows[0];
  if (!q) throw new AppError(404, "Quote not found.");
  try {
    await eventAccess(user, q.event_id, "read", 0, conn);
    return q;
  } catch (e) {
    if (!(e instanceof AppError) || e.status !== 403) throw e;
  }
  await businessAccess(user, q.business_id, "manage", conn);
  return q;
}
