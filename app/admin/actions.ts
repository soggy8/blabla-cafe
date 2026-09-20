"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authenticateOwner, getCurrentOwner, logoutOwner } from "@/lib/auth";
import { getDb } from "@/db/client";
import { menuItems } from "@/db/schema";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid(),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(100),
  description: z.string().max(300).default(""),
  price: z.coerce.number().int().positive().optional().or(z.literal("")),
  badge: z.string().max(30).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  featured: z.boolean(),
  available: z.boolean(),
});

export async function loginAction(
  _state: { error?: string },
  formData: FormData,
) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Проверете ги внесените податоци." };

  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const result = await authenticateOwner(
    parsed.data.email,
    parsed.data.password,
    `${ip}:${parsed.data.email.toLowerCase()}`,
  );

  if (!result.ok) {
    if (result.reason === "database") {
      return { error: "Админ панелот чека DATABASE_URL и иницијализација." };
    }
    if (result.reason === "blocked") {
      return { error: "Премногу обиди. Обидете се повторно за 15 минути." };
    }
    return { error: "Неточна е-пошта или лозинка." };
  }

  redirect("/admin");
}

export async function logoutAction() {
  await logoutOwner();
  redirect("/admin/login");
}

export async function saveMenuItemAction(formData: FormData) {
  const owner = await getCurrentOwner();
  if (!owner) throw new Error("Unauthorized");

  const parsed = itemSchema.safeParse({
    ...Object.fromEntries(formData),
    featured: formData.get("featured") === "on",
    available: formData.get("available") === "on",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid menu item");
  }

  const { id, price, badge, ...values } = parsed.data;
  const db = getDb();
  const record = {
    ...values,
    price: price === "" ? null : price,
    badge: badge || null,
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(menuItems).set(record).where(eq(menuItems.id, id));
  } else {
    await db.insert(menuItems).values(record);
  }

  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath("/admin");
}

export async function deleteMenuItemAction(formData: FormData) {
  const owner = await getCurrentOwner();
  if (!owner) throw new Error("Unauthorized");
  const id = z.string().uuid().parse(formData.get("id"));
  await getDb().delete(menuItems).where(eq(menuItems.id, id));
  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath("/admin");
}
