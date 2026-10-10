import { asc, desc, eq } from "drizzle-orm";
import {
  menuCategories as seedCategories,
  menuItems as seedItems,
  type MenuCategory,
  type MenuItem,
} from "@/data/menu";
import { getDb, hasDatabase } from "@/db/client";
import { menuCategories, menuItems, socialPosts } from "@/db/schema";

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
        image: item.imagePath ?? undefined,
        featured: item.featured,
        available: item.available,
      })),
    };
  } catch (error) {
    console.error("Database menu lookup failed; using bundled menu.", error);
    return { categories: seedCategories, items: seedItems, source: "seed" };
  }
}

export type FeedPost = {
  id: string;
  title: string;
  date: string;
  href: string;
  image: string;
};

const feedDate = new Intl.DateTimeFormat("mk-MK", { day: "numeric", month: "long" });

export async function getFeedPosts(limit = 3): Promise<FeedPost[]> {
  if (!hasDatabase()) return [];

  try {
    const rows = await getDb()
      .select()
      .from(socialPosts)
      .orderBy(desc(socialPosts.publishedAt))
      .limit(12);

    return rows
      .filter((row) => row.mediaUrl)
      .slice(0, limit)
      .map((row) => {
        const firstLine = row.caption?.split("\n")[0]?.trim() ?? "";
        return {
          id: row.id,
          title:
            firstLine.length > 60 ? `${firstLine.slice(0, 57).trimEnd()}…` : firstLine,
          date: feedDate.format(row.publishedAt),
          href: row.permalink,
          image: row.mediaUrl!,
        };
      });
  } catch (error) {
    console.error("Instagram feed lookup failed; using bundled posts.", error);
    return [];
  }
}
