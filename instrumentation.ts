export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.RUN_MIGRATIONS === "1" &&
    process.env.DATABASE_URL
  ) {
    const path = await import("node:path");
    const { eq } = await import("drizzle-orm");
    const { hash } = await import("@node-rs/argon2");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const { getDb } = await import("./db/client");
    const schema = await import("./db/schema");
    const seed = await import("./data/menu");
    const db = getDb();
    await migrate(db, {
      migrationsFolder: path.resolve("db/migrations"),
    });

    const existingCategories = await db.select().from(schema.menuCategories).limit(1);
    if (!existingCategories.length) {
      for (const category of seed.menuCategories) {
        await db.insert(schema.menuCategories).values({
          slug: category.id,
          name: category.name,
          eyebrow: category.eyebrow,
          sortOrder: category.order,
        });
      }
      const rows = await db.select().from(schema.menuCategories);
      const categoryIds = new Map(rows.map((row) => [row.slug, row.id]));
      for (const [index, item] of seed.menuItems.entries()) {
        await db.insert(schema.menuItems).values({
          categoryId: categoryIds.get(item.categoryId)!,
          slug: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          badge: item.badge,
          featured: item.featured,
          available: item.available,
          sortOrder: index,
        });
      }
      console.log("Prototype menu seeded.");
    }

    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
      const [existingOwner] = await db
        .select()
        .from(schema.owners)
        .where(eq(schema.owners.email, email))
        .limit(1);
      if (!existingOwner) {
        await db.insert(schema.owners).values({
          email,
          passwordHash: await hash(process.env.ADMIN_PASSWORD),
        });
        console.log(`Owner account created for ${email}.`);
      }
    }
    console.log("Startup database migrations complete.");
  }
}
