import { mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const owner = vi.fn();
vi.mock("@/lib/auth", () => ({ getCurrentOwner: owner }));
const { POST } = await import("./route");

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "up-"));
  process.env.UPLOAD_DIR = dir;
});
afterEach(async () => {
  delete process.env.UPLOAD_DIR;
  await rm(dir, { recursive: true, force: true });
});

async function request(file?: File) {
  const body = new FormData();
  if (file) body.set("file", file);
  return POST(new Request("http://x/api/uploads", { method: "POST", body }));
}
const png = async () =>
  new File(
    [new Uint8Array(await sharp({ create: { width: 8, height: 8, channels: 3, background: "#000" } }).png().toBuffer())],
    "a.png",
    { type: "image/png" },
  );

describe("POST /api/uploads", () => {
  it("requires an authenticated owner and writes nothing otherwise", async () => {
    owner.mockResolvedValue(null);
    expect((await request(await png())).status).toBe(401);
    expect(await readdir(dir)).toHaveLength(0);
  });

  it("stores an image for the owner", async () => {
    owner.mockResolvedValue({ id: "1", email: "o@e.c" });
    const response = await request(await png());
    expect(response.status).toBe(201);
    expect((await response.json()).path).toMatch(/^\/media\//);
  });

  it("returns 400 for a missing file or a corrupt image", async () => {
    owner.mockResolvedValue({ id: "1", email: "o@e.c" });
    expect((await request()).status).toBe(400);
    expect((await request(new File(["garbage"], "a.png", { type: "image/png" }))).status).toBe(400);
  });
});
