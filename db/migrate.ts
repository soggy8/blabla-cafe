import "dotenv/config";

import path from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDb } from "./client";

async function main() {
  await migrate(getDb(), {
    migrationsFolder: path.resolve("db/migrations"),
  });
  console.log("Database migrations complete.");
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
