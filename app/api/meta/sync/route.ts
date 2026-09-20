import { revalidatePath } from "next/cache";
import { syncInstagramPosts } from "@/lib/meta/instagram";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    secret !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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
