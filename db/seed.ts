import "dotenv/config";

import { hash } from "@node-rs/argon2";
import { eq, inArray } from "drizzle-orm";
import { menuCategories as seedCategories, menuItems as seedItems } from "../data/menu";
import { getDb } from "./client";
import {
  menuCategories,
  menuItems,
  owners,
  siteSettings,
} from "./schema";

const db = getDb();

// Categories from the early prototype menu, replaced by the printed menu. Deleting them cascades to their items.
const retiredCategorySlugs = ["coffee", "cold", "food", "evening"];
await db.delete(menuCategories).where(inArray(menuCategories.slug, retiredCategorySlugs));

for (const category of seedCategories) {
  await db
    .insert(menuCategories)
    .values({
      slug: category.id,
      name: category.name,
      eyebrow: category.eyebrow,
      sortOrder: category.order,
    })
    .onConflictDoUpdate({
      target: menuCategories.slug,
      set: {
        name: category.name,
        eyebrow: category.eyebrow,
        sortOrder: category.order,
        updatedAt: new Date(),
      },
    });
}

const categoryRows = await db.select().from(menuCategories);
const categoryIds = new Map(categoryRows.map((row) => [row.slug, row.id]));

for (const [index, item] of seedItems.entries()) {
  const categoryId = categoryIds.get(item.categoryId);
  if (!categoryId) throw new Error(`Missing category ${item.categoryId}`);
  await db
    .insert(menuItems)
    .values({
      categoryId,
      slug: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      badge: item.badge,
      imagePath: item.image,
      featured: item.featured,
      available: item.available,
      sortOrder: index,
    })
    .onConflictDoUpdate({
      target: menuItems.slug,
      set: {
        categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        badge: item.badge,
        imagePath: item.image,
        featured: item.featured,
        available: item.available,
        sortOrder: index,
        updatedAt: new Date(),
      },
    });
}

await db
  .insert(siteSettings)
  .values({
    key: "business",
    value: {
      name: "Bla Bla Cafe",
      address: "Маршал Тито 146, Струмица",
      phone: "078 242 666",
      hours: "08:00–01:00",
      instagram: "https://www.instagram.com/blablacafe14/",
    },
  })
  .onConflictDoUpdate({
    target: siteSettings.key,
    set: { updatedAt: new Date() },
  });

if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
  const passwordHash = await hash(process.env.ADMIN_PASSWORD);
  const [existing] = await db.select().from(owners).where(eq(owners.email, email));
  if (existing) {
    await db.update(owners).set({ passwordHash }).where(eq(owners.id, existing.id));
  } else {
    await db.insert(owners).values({ email, passwordHash });
  }
  console.log(`Owner account ready for ${email}.`);
} else {
  console.warn("ADMIN_EMAIL/ADMIN_PASSWORD missing; owner account was not created.");
}

console.log("Menu content seeded.");
process.exit(0);
