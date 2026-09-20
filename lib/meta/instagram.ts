import "server-only";

import { getDb, hasDatabase } from "@/db/client";
import { socialPosts } from "@/db/schema";

type InstagramMedia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
};

type InstagramResponse = {
  data: InstagramMedia[];
  paging?: { next?: string };
};

export function isMetaConfigured() {
  return Boolean(
    process.env.INSTAGRAM_USER_ID && process.env.INSTAGRAM_ACCESS_TOKEN,
  );
}

export async function syncInstagramPosts() {
  if (!hasDatabase()) throw new Error("DATABASE_URL is not configured.");
  if (!isMetaConfigured()) throw new Error("Instagram credentials are missing.");

  const version = process.env.META_GRAPH_VERSION ?? "v24.0";
  const fields = [
    "id",
    "caption",
    "media_type",
    "media_url",
    "thumbnail_url",
    "permalink",
    "timestamp",
  ].join(",");
  const url = new URL(
    `https://graph.instagram.com/${version}/${process.env.INSTAGRAM_USER_ID}/media`,
  );
  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", "24");
  url.searchParams.set("access_token", process.env.INSTAGRAM_ACCESS_TOKEN!);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Instagram sync failed (${response.status}): ${message}`);
  }

  const payload = (await response.json()) as InstagramResponse;
  const db = getDb();

  for (const post of payload.data) {
    await db
      .insert(socialPosts)
      .values({
        externalId: post.id,
        mediaType: post.media_type,
        mediaUrl: post.media_url,
        thumbnailUrl: post.thumbnail_url,
        caption: post.caption,
        permalink: post.permalink,
        publishedAt: new Date(post.timestamp),
        raw: post,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: socialPosts.externalId,
        set: {
          mediaType: post.media_type,
          mediaUrl: post.media_url,
          thumbnailUrl: post.thumbnail_url,
          caption: post.caption,
          permalink: post.permalink,
          publishedAt: new Date(post.timestamp),
          raw: post,
          updatedAt: new Date(),
        },
      });
  }

  return { synced: payload.data.length };
}
