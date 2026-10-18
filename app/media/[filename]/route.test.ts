import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET } from "./route";

let dir: string;
const name = "123e4567-e89b-12d3-a456-426614174000.webp";
const call = (filename: string) =>
  GET(new Request("http://x"), { params: Promise.resolve({ filename }) });

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), "media-"));
  process.env.UPLOAD_DIR = dir;
  await writeFile(path.join(dir, name), "data");
  await writeFile(path.join(dir, "secret.txt"), "secret");
});
afterEach(async () => {
  delete process.env.UPLOAD_DIR;
  await rm(dir, { recursive: true, force: true });
});

describe("GET /media/[filename]", () => {
  it("serves an uploaded image with immutable caching and nosniff", async () => {
    const response = await call(name);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("cache-control")).toContain("immutable");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("404s for missing files and any non-UUID name", async () => {
    for (const bad of [
      "00000000-0000-0000-0000-000000000000.webp",
      "secret.txt",
      "../secret.txt",
      "..%2Fsecret.txt",
      `${name}/../secret.txt`,
      `${name}.txt`,
      "",
    ]) {
      expect((await call(bad)).status).toBe(404);
    }
  });
});
