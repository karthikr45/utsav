import { database } from "../src/server/db";
async function main() {
  await database();
  console.log(
    "PostgreSQL schema is ready. Demo data is seeded only when DEMO_MODE=true.",
  );
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
