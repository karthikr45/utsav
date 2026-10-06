import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";
export interface Database {
  query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[] }>;
  transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T>;
}
const globals = globalThis as unknown as { utsavDb?: Promise<Database> };
export const demoMode = () => process.env.DEMO_MODE === "true";
async function connect(): Promise<Database> {
  let db: Database;
  if (process.env.DATABASE_URL) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    });
    db = {
      query: async (sql, params) => pool.query(sql, params) as any,
      transaction: async (fn) => {
        const c = await pool.connect();
        try {
          await c.query("BEGIN");
          const value = await fn({
            query: async (s, p) => c.query(s, p) as any,
            transaction: async () => {
              throw new Error("Nested transaction unsupported");
            },
          });
          await c.query("COMMIT");
          return value;
        } catch (e) {
          await c.query("ROLLBACK");
          throw e;
        } finally {
          c.release();
        }
      },
    };
  } else {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.ALLOW_EMBEDDED_DB !== "true"
    )
      throw new Error("DATABASE_URL is required in production");
    await mkdir(path.join(process.cwd(), ".data"), { recursive: true });
    const pg = new PGlite(path.join(process.cwd(), ".data/postgres"));
    await pg.waitReady;
    db = {
      query: async (s, p) => (await pg.query(s, p)) as any,
      transaction: async (fn) =>
        pg.transaction(async (tx) =>
          fn({
            query: async (s, p) => (await tx.query(s, p)) as any,
            transaction: async () => {
              throw new Error("Nested transaction unsupported");
            },
          }),
        ),
    };
  }
  const schema = await readFile(
    path.join(process.cwd(), "src/server/schema.sql"),
    "utf8",
  );
  // Statements contain no procedural SQL; each migration is idempotent.
  for (const statement of schema
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean))
    await db.query(statement);
  if (demoMode()) {
    const { seed } = await import("./seed");
    await seed(db);
  }
  return db;
}
export function database() {
  return (globals.utsavDb ??= connect().catch((e) => {
    globals.utsavDb = undefined;
    throw e;
  }));
}
export async function query<T = any>(
  sql: string,
  params: any[] = [],
): Promise<T[]> {
  return (await (await database()).query<T>(sql, params)).rows;
}
