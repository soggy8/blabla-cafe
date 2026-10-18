import { revalidatePath } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { isMetaConfigured, syncInstagramPosts } from "@/lib/meta/instagram";

export const runtime = "nodejs";

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const wanted = Buffer.from(`Bearer ${expected}`);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isMetaConfigured()) {
    return Response.json({ skipped: "Instagram is not configured." });
  }

  try {
    const result = await syncInstagramPosts();
    revalidatePath("/");
    return Response.json(result);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 },
    );
  }
}
