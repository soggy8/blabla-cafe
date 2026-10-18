import { eq } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { menuCategories as seedCategories, menuItems as seedItems } from "@/data/menu";
import * as schema from "@/db/schema";

// Structural type so both postgres-js (production) and PGlite (tests) fit.
export type BootstrapDb = PgDatabase<PgQueryResultHKT, typeof schema>;

export async function seedMenuIfEmpty(db: BootstrapDb) {
  const existing = await db.select().from(schema.menuCategories).limit(1);
  if (existing.length) return false;

  for (const category of seedCategories) {
    await db.insert(schema.menuCategories).values({
      slug: category.id,
      name: category.name,
      eyebrow: category.eyebrow,
      sortOrder: category.order,
    });
  }
  const rows = await db.select().from(schema.menuCategories);
  const categoryIds = new Map(rows.map((row) => [row.slug, row.id]));
  for (const [index, item] of seedItems.entries()) {
    await db.insert(schema.menuItems).values({
      categoryId: categoryIds.get(item.categoryId)!,
      slug: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      badge: item.badge,
      imagePath: item.image,
      featured: item.featured,
      available: item.available,
      sortOrder: index,
    });
  }
  return true;
}

export type OwnerResult = "created" | "reset" | "exists" | "skipped";

// Creates the owner on first start. With `reset`, an existing owner's password
// is replaced and every session is revoked (forgotten-password recovery).
export async function ensureOwner(
  db: BootstrapDb,
  env: { email?: string; password?: string; reset?: boolean },
): Promise<OwnerResult> {
  if (!env.email || !env.password) return "skipped";
  const email = env.email.trim().toLowerCase();
  const [existing] = await db
    .select()
    .from(schema.owners)
    .where(eq(schema.owners.email, email))
    .limit(1);

  if (!existing) {
    await db
      .insert(schema.owners)
      .values({ email, passwordHash: await hash(env.password) });
    return "created";
  }
  if (!env.reset) return "exists";

  await db
    .update(schema.owners)
    .set({ passwordHash: await hash(env.password) })
    .where(eq(schema.owners.id, existing.id));
  await db.delete(schema.sessions).where(eq(schema.sessions.ownerId, existing.id));
  return "reset";
}
