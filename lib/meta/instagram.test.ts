import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { siteSettings, socialPosts } from "@/db/schema";
import { createTestDb } from "@/tests/support/db";
import { state } from "@/tests/support/mocks";

vi.mock("@/db/client", async () => (await import("@/tests/support/mocks")).dbModule);

const { getInstagramToken, needsRefresh } = await import("./token");
const { syncInstagramPosts } = await import("./instagram");

let dir: string;
const calls: string[] = [];

async function image() {
  return sharp({ create: { width: 20, height: 20, channels: 3, background: "#fff" } }).jpeg().toBuffer();
}

function stubFetch(handlers: { refresh?: () => Response; media?: unknown[] }) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: URL | string) => {
      const url = new URL(input.toString());
      calls.push(url.pathname);
      if (url.pathname.endsWith("/refresh_access_token")) {
        return handlers.refresh?.() ?? new Response("nope", { status: 400 });
      }
      if (url.pathname.endsWith("/media")) {
        return Response.json({ data: handlers.media ?? [] });
      }
      return new Response(new Uint8Array(await image()));
    }),
  );
}

beforeEach(async () => {
  state.db = await createTestDb();
  dir = await mkdtemp(path.join(os.tmpdir(), "ig-"));
  process.env.UPLOAD_DIR = dir;
  process.env.INSTAGRAM_USER_ID = "123";
  process.env.INSTAGRAM_ACCESS_TOKEN = "env-token";
  calls.length = 0;
});
afterEach(async () => {
  vi.unstubAllGlobals();
  for (const key of ["UPLOAD_DIR", "INSTAGRAM_USER_ID", "INSTAGRAM_ACCESS_TOKEN"]) delete process.env[key];
  await rm(dir, { recursive: true, force: true });
});

const refreshOk = () => Response.json({ access_token: "fresh-token", expires_in: 5184000 });

describe("needsRefresh", () => {
  it("refreshes tokens older than a week", () => {
    const now = new Date("2026-01-20T00:00:00Z");
    expect(needsRefresh(new Date("2026-01-14T00:00:00Z"), now)).toBe(false);
    expect(needsRefresh(new Date("2026-01-13T00:00:00Z"), now)).toBe(true);
  });
});

describe("getInstagramToken", () => {
  it("refreshes the first time and persists the new token", async () => {
    stubFetch({ refresh: refreshOk });
    const result = await getInstagramToken();
    expect(result).toMatchObject({ token: "fresh-token", refreshed: true });
    expect(result.expiresAt).toBeTruthy();
    const [row] = await state.db!.select().from(siteSettings);
    expect(row.value).toMatchObject({ token: "fresh-token", source: "env-token" });
  });

  it("reuses a recent stored token without calling Instagram", async () => {
    stubFetch({ refresh: refreshOk });
    await getInstagramToken();
    calls.length = 0;
    const result = await getInstagramToken();
    expect(result).toMatchObject({ token: "fresh-token", refreshed: false });
    expect(calls).toHaveLength(0);
  });

  it("refreshes again once the stored token is old", async () => {
    stubFetch({ refresh: refreshOk });
    await getInstagramToken();
    const [row] = await state.db!.select().from(siteSettings);
    await state.db!
      .update(siteSettings)
      .set({ value: { ...(row.value as object), refreshedAt: new Date(Date.now() - 8 * 864e5).toISOString() } })
      .where(eq(siteSettings.key, row.key));
    expect((await getInstagramToken()).refreshed).toBe(true);
  });

  it("prefers a newly pasted .env token over a stale stored one", async () => {
    stubFetch({ refresh: refreshOk });
    await getInstagramToken();
    process.env.INSTAGRAM_ACCESS_TOKEN = "new-env-token";
    stubFetch({ refresh: () => Response.json({ access_token: "second", expires_in: 1 }) });
    expect((await getInstagramToken()).token).toBe("second");
    const [row] = await state.db!.select().from(siteSettings);
    expect(row.value).toMatchObject({ source: "new-env-token" });
  });

  it("falls back to the current token when refresh fails", async () => {
    stubFetch({});
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await getInstagramToken()).toMatchObject({ token: "env-token", refreshed: false });
    expect(spy).toHaveBeenCalled();
  });
});

describe("syncInstagramPosts", () => {
  const media = [
    {
      id: "1",
      media_type: "IMAGE",
      permalink: "https://instagram.com/p/1",
      timestamp: "2026-01-01T10:00:00+0000",
      caption: "Hello",
    },
    {
      id: "2",
      media_type: "VIDEO",
      permalink: "https://instagram.com/p/2",
      timestamp: "2026-01-02T10:00:00+0000",
    },
  ];

  it("stores posts without downloading any images", async () => {
    stubFetch({ refresh: refreshOk, media });
    const result = await syncInstagramPosts();
    expect(result).toMatchObject({ synced: 2, tokenRefreshed: true });
    const rows = await state.db!.select().from(socialPosts);
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.mediaUrl === null)).toBe(true);
    expect(calls.filter((c) => c.endsWith(".jpg"))).toHaveLength(0);
  });

  it("is idempotent", async () => {
    stubFetch({ refresh: refreshOk, media });
    await syncInstagramPosts();
    await syncInstagramPosts();
    expect(await state.db!.select().from(socialPosts)).toHaveLength(2);
  });

  it("throws on an Instagram API error so the cron run is visibly failed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: URL | string) =>
        input.toString().includes("refresh_access_token")
          ? new Response("x", { status: 400 })
          : new Response("expired", { status: 400 }),
      ),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(syncInstagramPosts()).rejects.toThrow(/Instagram sync failed \(400\)/);
  });

  it("requires credentials and a database", async () => {
    delete process.env.INSTAGRAM_ACCESS_TOKEN;
    await expect(syncInstagramPosts()).rejects.toThrow(/credentials/);
  });
});
