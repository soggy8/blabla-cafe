import "server-only";

import { createHash } from "node:crypto";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getDb, hasDatabase } from "@/db/client";
import { socialPosts } from "@/db/schema";
import { uploadDirectory } from "@/lib/uploads";

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

// Instagram CDN URLs expire, so each post image is copied into the upload
// directory under a stable UUID-shaped name derived from the media id.
async function cacheInstagramImage(post: InstagramMedia) {
  const source =
    post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url;
  if (!source) return null;

  const hash = createHash("sha1").update(post.id).digest("hex");
  const name = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}.webp`;
  const file = path.join(uploadDirectory(), name);

  try {
    await access(file);
    return `/media/${name}`;
  } catch {}

  try {
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) return null;
    const output = await sharp(Buffer.from(await response.arrayBuffer()))
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    await mkdir(uploadDirectory(), { recursive: true });
    await writeFile(file, output);
    return `/media/${name}`;
  } catch (error) {
    console.error(`Could not cache Instagram image for ${post.id}.`, error);
    return null;
  }
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
    const localImage = await cacheInstagramImage(post);
    await db
      .insert(socialPosts)
      .values({
        externalId: post.id,
        mediaType: post.media_type,
        mediaUrl: localImage,
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
          mediaUrl: localImage,
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
