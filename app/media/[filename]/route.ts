import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const safeFilename = /^[0-9a-f-]{36}\.webp$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!safeFilename.test(filename)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const directory = path.resolve(
      /* turbopackIgnore: true */ process.env.UPLOAD_DIR ?? "./storage/uploads",
    );
    const image = await readFile(
      /* turbopackIgnore: true */ path.join(directory, filename),
    );
    return new Response(image, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
