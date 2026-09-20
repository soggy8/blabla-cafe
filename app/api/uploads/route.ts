import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getCurrentOwner } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  if (!(await getCurrentOwner())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || !allowedTypes.has(file.type)) {
    return Response.json({ error: "Unsupported image type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Image is larger than 8 MB" }, { status: 413 });
  }

  const input = Buffer.from(await file.arrayBuffer());
  const metadata = await sharp(input).metadata();
  if (!metadata.width || !metadata.height) {
    return Response.json({ error: "Invalid image" }, { status: 400 });
  }

  const output = await sharp(input)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const directory = path.resolve(
    /* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? "./storage/uploads",
  );
  await mkdir(directory, { recursive: true });
  const filename = `${randomUUID()}.webp`;
  await writeFile(path.join(directory, filename), output, { flag: "wx" });

  return Response.json({ path: `/media/${filename}` }, { status: 201 });
}
