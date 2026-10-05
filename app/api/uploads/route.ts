import { getCurrentOwner } from "@/lib/auth";
import { saveImageUpload } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await getCurrentOwner())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Unsupported image type" }, { status: 400 });
  }

  const result = await saveImageUpload(file);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ path: result.path }, { status: 201 });
}
