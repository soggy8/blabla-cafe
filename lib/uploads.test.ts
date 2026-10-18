import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deleteImageUpload, MAX_UPLOAD_BYTES, saveImageUpload } from "./uploads";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "uploads-"));
  process.env.UPLOAD_DIR = dir;
});
afterEach(async () => {
  delete process.env.UPLOAD_DIR;
  await rm(dir, { recursive: true, force: true });
});

const png = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: "#c33" } }).png().toBuffer();

const file = (data: Buffer | string, type: string) =>
  new File([new Uint8Array(Buffer.from(data))], "x", { type });

describe("saveImageUpload", () => {
  it("re-encodes to WebP, caps size at 1600px, and returns a /media path", async () => {
    const result = await saveImageUpload(file(await png(3200, 800), "image/png"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.path).toMatch(/^\/media\/[0-9a-f-]{36}\.webp$/);
    const saved = path.join(dir, path.basename(result.path));
    const meta = await sharp(saved).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(1600);
  });

  it("does not enlarge small images", async () => {
    const result = await saveImageUpload(file(await png(100, 80), "image/png"));
    if (!result.ok) throw new Error("expected ok");
    expect((await sharp(path.join(dir, path.basename(result.path))).metadata()).width).toBe(100);
  });

  it("rejects unsupported types", async () => {
    expect(await saveImageUpload(file("<svg/>", "image/svg+xml"))).toMatchObject({ ok: false, status: 400 });
    expect(await saveImageUpload(file("x", "application/pdf"))).toMatchObject({ ok: false, status: 400 });
    expect(await readdir(dir)).toHaveLength(0);
  });

  it("rejects oversized files", async () => {
    const big = file(Buffer.alloc(MAX_UPLOAD_BYTES + 1), "image/png");
    expect(await saveImageUpload(big)).toMatchObject({ ok: false, status: 413 });
  });

  it("rejects content that is not an image despite a valid type header", async () => {
    expect(await saveImageUpload(file("not an image", "image/png"))).toMatchObject({ ok: false, status: 400 });
    expect(await readdir(dir)).toHaveLength(0);
  });
});

describe("deleteImageUpload", () => {
  it("removes only files the app created", async () => {
    const result = await saveImageUpload(file(await png(10, 10), "image/png"));
    if (!result.ok) throw new Error("expected ok");
    await deleteImageUpload(result.path);
    expect(await readdir(dir)).toHaveLength(0);
  });

  it("ignores traversal, bundled images and empty values", async () => {
    const result = await saveImageUpload(file(await png(10, 10), "image/png"));
    if (!result.ok) throw new Error("expected ok");
    await deleteImageUpload("/media/../../etc/passwd");
    await deleteImageUpload("/media/featured-espresso.webp");
    await deleteImageUpload(null);
    await deleteImageUpload(undefined);
    expect((await stat(path.join(dir, path.basename(result.path)))).isFile()).toBe(true);
  });
});
