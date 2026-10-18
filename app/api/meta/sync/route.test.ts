import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sync = vi.fn(async () => ({ synced: 3 }));
const configured = vi.fn(() => true);
vi.mock("@/lib/meta/instagram", () => ({ syncInstagramPosts: sync, isMetaConfigured: configured }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { POST } = await import("./route");

const req = (auth?: string) =>
  new Request("http://x/api/meta/sync", { method: "POST", headers: auth ? { authorization: auth } : {} });

beforeEach(() => {
  process.env.CRON_SECRET = "s3cret";
  sync.mockClear();
  configured.mockReturnValue(true);
});
afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe("POST /api/meta/sync", () => {
  it("rejects missing and wrong secrets", async () => {
    for (const header of [undefined, "Bearer wrong", "s3cret", "Bearer s3cre", "Bearer s3cretx"]) {
      expect((await POST(req(header))).status).toBe(401);
    }
    expect(sync).not.toHaveBeenCalled();
  });

  it("rejects everything when no secret is configured", async () => {
    delete process.env.CRON_SECRET;
    expect((await POST(req("Bearer "))).status).toBe(401);
    expect((await POST(req("Bearer undefined"))).status).toBe(401);
  });

  it("runs the sync with the right secret", async () => {
    const response = await POST(req("Bearer s3cret"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ synced: 3 });
  });

  it("skips quietly when Instagram is not configured", async () => {
    configured.mockReturnValue(false);
    const response = await POST(req("Bearer s3cret"));
    expect(response.status).toBe(200);
    expect(await response.json()).toHaveProperty("skipped");
    expect(sync).not.toHaveBeenCalled();
  });

  it("reports sync failures as 500", async () => {
    sync.mockRejectedValueOnce(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await POST(req("Bearer s3cret"));
    expect(response.status).toBe(500);
  });
});
