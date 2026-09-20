import "dotenv/config";

import path from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDb } from "./client";

await migrate(getDb(), {
  migrationsFolder: path.resolve("db/migrations"),
});

console.log("Database migrations complete.");
process.exit(0);
