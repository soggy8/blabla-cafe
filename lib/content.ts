import { and, asc, desc, eq, gte, isNull, or } from "drizzle-orm";
import {
  menuCategories as seedCategories,
  menuItems as seedItems,
  type MenuCategory,
  type MenuItem,
} from "@/data/menu";
import { promotionSeeds } from "@/data/promotions";
import { getDb, hasDatabase } from "@/db/client";
import { menuCategories, menuItems, promotions, socialPosts } from "@/db/schema";
import { parseOfferLines, todayInSkopje, type OfferLine } from "@/lib/promotions";

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
        slug: category.slug,
        eyebrow: category.eyebrow,
        order: category.sortOrder,
      })),
      items: itemRows.map((item) => ({
        id: item.id,
        slug: item.slug,
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
      .map((row) => {
        const firstLine = row.caption?.split("\n")[0]?.trim() ?? "";
        return {
          id: row.id,
          title:
            firstLine.length > 80 ? `${firstLine.slice(0, 77).trimEnd()}…` : firstLine,
          date: feedDate.format(row.publishedAt),
          href: row.permalink,
        };
      })
      .filter((post) => post.title)
      .slice(0, limit);
  } catch (error) {
    console.error("Instagram feed lookup failed; using bundled posts.", error);
    return [];
  }
}

export type PublicPromotion = {
  id: string;
  title: string;
  validity: string;
  offers: OfferLine[];
  image?: string;
  link?: string;
};

const fallbackPromotions: PublicPromotion[] = promotionSeeds
  .filter((promotion) => promotion.active)
  .map((promotion, index) => ({
    id: `seed-${index}`,
    title: promotion.title,
    validity: promotion.validity,
    offers: parseOfferLines(promotion.description),
    link: promotion.link,
  }));

export async function getPromotions(): Promise<PublicPromotion[]> {
  if (!hasDatabase()) return fallbackPromotions;

  try {
    const rows = await getDb()
      .select()
      .from(promotions)
      .where(
        and(
          eq(promotions.active, true),
          or(isNull(promotions.endsOn), gte(promotions.endsOn, todayInSkopje())),
        ),
      )
      .orderBy(desc(promotions.createdAt));

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      validity: row.validity,
      offers: parseOfferLines(row.description),
      image: row.imagePath ?? undefined,
      link: row.link ?? undefined,
    }));
  } catch (error) {
    console.error("Promotions lookup failed; hiding the section.", error);
    return [];
  }
}
