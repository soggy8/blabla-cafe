import { asc, eq } from "drizzle-orm";
import {
  menuCategories as seedCategories,
  menuItems as seedItems,
  type MenuCategory,
  type MenuItem,
} from "@/data/menu";
import { getDb, hasDatabase } from "@/db/client";
import { menuCategories, menuItems } from "@/db/schema";

export async function getMenu(): Promise<{
  categories: MenuCategory[];
  items: MenuItem[];
  source: "database" | "seed";
}> {
  if (!hasDatabase()) {
    return { categories: seedCategories, items: seedItems, source: "seed" };
  }

  try {
    const db = getDb();
    const [categoryRows, itemRows] = await Promise.all([
      db
        .select()
        .from(menuCategories)
        .where(eq(menuCategories.active, true))
        .orderBy(asc(menuCategories.sortOrder)),
      db.select().from(menuItems).orderBy(asc(menuItems.sortOrder)),
    ]);

    return {
      source: "database",
      categories: categoryRows.map((category) => ({
        id: category.id,
        name: category.name,
        eyebrow: category.eyebrow,
        order: category.sortOrder,
      })),
      items: itemRows.map((item) => ({
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        price: item.price ?? undefined,
        badge: item.badge as MenuItem["badge"],
        featured: item.featured,
        available: item.available,
      })),
    };
  } catch (error) {
    console.error("Database menu lookup failed; using prototype seed.", error);
    return { categories: seedCategories, items: seedItems, source: "seed" };
  }
}
