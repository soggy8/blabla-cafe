import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export type UploadResult =
  | { ok: true; path: string }
  | { ok: false; status: number; error: string };

export async function saveImageUpload(file: File): Promise<UploadResult> {
  if (!allowedTypes.has(file.type)) {
    return { ok: false, status: 400, error: "Unsupported image type" };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, status: 413, error: "Image is larger than 8 MB" };
  }

  const input = Buffer.from(await file.arrayBuffer());
  const metadata = await sharp(input).metadata();
  if (!metadata.width || !metadata.height) {
    return { ok: false, status: 400, error: "Invalid image" };
  }

  const output = await sharp(input)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const directory = uploadDirectory();
  await mkdir(directory, { recursive: true });
  const filename = `${randomUUID()}.webp`;
  await writeFile(path.join(directory, filename), output, { flag: "wx" });

  return { ok: true, path: `/media/${filename}` };
}

const uploadedPath = /^\/media\/([0-9a-f-]{36}\.webp)$/i;

export async function deleteImageUpload(publicPath: string | null | undefined) {
  const filename = publicPath?.match(uploadedPath)?.[1];
  if (!filename) return;
  await rm(path.join(uploadDirectory(), filename), { force: true });
}

export function uploadDirectory() {
  return path.resolve(
    /* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? "./storage/uploads",
  );
}
