import { sql } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasDatabase()) {
    return Response.json({ ok: true, database: false });
  }

  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ ok: true, database: true });
  } catch {
    return Response.json({ ok: false, database: false }, { status: 503 });
  }
}
