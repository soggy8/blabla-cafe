import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { siteSettings } from "@/db/schema";

// Long-lived Instagram tokens last 60 days and can be refreshed once they are
// at least 24 hours old. The refreshed token cannot be written back to .env,
// so it is kept in the database. `source` records which .env token it came
// from: pasting a new token into .env supersedes the stored one.
const SETTINGS_KEY = "instagram_token";
const REFRESH_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

type StoredToken = {
  token: string;
  source: string;
  refreshedAt: string;
  expiresAt: string | null;
};

export type TokenStatus = {
  token: string;
  refreshed: boolean;
  expiresAt: string | null;
};

async function readStored(envToken: string) {
  const [row] = await getDb()
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, SETTINGS_KEY))
    .limit(1);
  const value = row?.value as StoredToken | undefined;
  return value && value.source === envToken ? value : null;
}

export function needsRefresh(refreshedAt: Date, now = new Date()) {
  return now.getTime() - refreshedAt.getTime() >= REFRESH_AFTER_MS;
}

export async function getInstagramToken(
  fetcher: typeof fetch = fetch,
): Promise<TokenStatus> {
  const envToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!envToken) throw new Error("Instagram credentials are missing.");

  const stored = await readStored(envToken);
  const current = stored?.token ?? envToken;
  const refreshedAt = stored ? new Date(stored.refreshedAt) : null;

  if (refreshedAt && !needsRefresh(refreshedAt)) {
    return { token: current, refreshed: false, expiresAt: stored!.expiresAt };
  }

  try {
    const url = new URL("https://graph.instagram.com/refresh_access_token");
    url.searchParams.set("grant_type", "ig_refresh_token");
    url.searchParams.set("access_token", current);
    const response = await fetcher(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    const payload = (await response.json()) as {
      access_token: string;
      expires_in?: number;
    };
    const now = new Date();
    const next: StoredToken = {
      token: payload.access_token,
      source: envToken,
      refreshedAt: now.toISOString(),
      expiresAt: payload.expires_in
        ? new Date(now.getTime() + payload.expires_in * 1000).toISOString()
        : null,
    };
    await getDb()
      .insert(siteSettings)
      .values({ key: SETTINGS_KEY, value: next, updatedAt: now })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: next, updatedAt: now },
      });
    return { token: next.token, refreshed: true, expiresAt: next.expiresAt };
  } catch (error) {
    // A failed refresh must not stop the sync while the token still works;
    // an expired token will fail the sync loudly right after this.
    console.error("Instagram token refresh failed.", error);
    return { token: current, refreshed: false, expiresAt: stored?.expiresAt ?? null };
  }
}
