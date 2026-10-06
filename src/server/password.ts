import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, hash: string) {
  const [salt, value] = hash.split(":");
  if (!salt || !value) return false;
  const derived = scryptSync(password, salt, 64);
  const stored = Buffer.from(value, "hex");
  return stored.length === derived.length && timingSafeEqual(stored, derived);
}
