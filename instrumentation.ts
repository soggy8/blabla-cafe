export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.RUN_MIGRATIONS === "1" &&
    process.env.DATABASE_URL
  ) {
    const path = await import("node:path");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const { getDb } = await import("./db/client");
    const { ensureOwner, seedMenuIfEmpty, seedPromotionsOnce } = await import("./lib/bootstrap");
    const db = getDb();
    await migrate(db, {
      migrationsFolder: path.resolve("db/migrations"),
    });

    if (await seedMenuIfEmpty(db)) console.log("Menu seeded.");
    if (await seedPromotionsOnce(db)) console.log("Placeholder promotions seeded.");

    const owner = await ensureOwner(db, {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      reset: process.env.RESET_ADMIN_PASSWORD === "1",
    });
    if (owner === "created") console.log("Owner account created.");
    if (owner === "reset") {
      console.log(
        "Owner password reset and all sessions revoked. Remove RESET_ADMIN_PASSWORD from .env and restart.",
      );
    }
    console.log("Startup database migrations complete.");
  }
}
