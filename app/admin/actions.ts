"use server";

import { and, eq, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  authenticateOwner,
  changeOwnerPassword,
  getCurrentOwner,
  logoutOwner,
} from "@/lib/auth";
import { clientIp } from "@/lib/client-ip";
import { promotionFromCaption } from "@/lib/promotions";
import { slugify } from "@/lib/slug";
import { deleteImageUpload, saveImageUpload } from "@/lib/uploads";
import { getDb } from "@/db/client";
import { menuCategories, menuItems, promotions, socialPosts } from "@/db/schema";

const loginSchema = z.object({
  email: z.string().email(),
  // Only checks the shape: the length rules apply when a password is set, and
  // an existing owner must always be able to sign in.
  password: z.string().min(1).max(200),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Внесете ја тековната лозинка.").max(200),
    newPassword: z
      .string()
      .min(12, "Новата лозинка мора да има најмалку 12 знаци.")
      .max(200, "Новата лозинка е предолга."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Новите лозинки не се совпаѓаат.",
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Новата лозинка мора да се разликува од тековната.",
  });

const slugField = z
  .string()
  .max(80)
  .regex(/^[a-z0-9-]*$/)
  .default("");

const itemSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid(),
  slug: slugField,
  name: z.string().trim().min(2).max(100),
  description: z.string().max(300).default(""),
  price: z.coerce.number().int().positive().optional().or(z.literal("")),
  badge: z.string().max(30).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  featured: z.boolean(),
  available: z.boolean(),
  removeImage: z.boolean(),
});

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(60),
  eyebrow: z.string().trim().max(60).default(""),
  sortOrder: z.coerce.number().int().min(0).max(999),
  active: z.boolean(),
});

const promotionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(100),
  validity: z.string().trim().max(80).default(""),
  description: z.string().trim().max(600).default(""),
  endsOn: z.union([z.literal(""), z.iso.date()]).default(""),
  link: z.union([z.literal(""), z.string().trim().url().startsWith("https://")]).default(""),
  active: z.boolean(),
  removeImage: z.boolean(),
});

export async function loginAction(
  _state: { error?: string },
  formData: FormData,
) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Проверете ги внесените податоци." };

  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);
  const result = await authenticateOwner(
    parsed.data.email,
    parsed.data.password,
    ip,
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

export async function changePasswordAction(
  _state: { error?: string; success?: boolean },
  formData: FormData,
) {
  const owner = await getCurrentOwner();
  if (!owner) redirect("/admin/login");

  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверете ги внесените податоци." };
  }
  const { currentPassword, newPassword } = parsed.data;
  if (!(await changeOwnerPassword(owner.id, currentPassword, newPassword))) {
    return { error: "Тековната лозинка не е точна." };
  }
  return { success: true };
}

export async function saveMenuItemAction(formData: FormData) {
  await requireOwner();

  const parsed = itemSchema.safeParse({
    ...Object.fromEntries(formData),
    featured: formData.get("featured") === "on",
    available: formData.get("available") === "on",
    removeImage: formData.get("removeImage") === "on",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid menu item");
  }

  const { id, price, badge, slug, removeImage, ...values } = parsed.data;
  const db = getDb();
  const [existing] = id
    ? await db
        .select({ imagePath: menuItems.imagePath })
        .from(menuItems)
        .where(eq(menuItems.id, id))
    : [];

  let imagePath = existing?.imagePath ?? null;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const upload = await saveImageUpload(image);
    if (!upload.ok) throw new Error(upload.error);
    imagePath = upload.path;
  } else if (removeImage) {
    imagePath = null;
  }

  const record = {
    ...values,
    slug: await uniqueItemSlug(slug || slugify(values.name) || "item", id),
    price: price === "" ? null : price,
    badge: badge || null,
    imagePath,
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(menuItems).set(record).where(eq(menuItems.id, id));
  } else {
    await db.insert(menuItems).values(record);
  }

  if (existing?.imagePath && existing.imagePath !== imagePath) {
    await deleteImageUpload(existing.imagePath);
  }

  revalidateMenu();
}

export async function deleteMenuItemAction(formData: FormData) {
  await requireOwner();
  const id = z.string().uuid().parse(formData.get("id"));
  const [deleted] = await getDb()
    .delete(menuItems)
    .where(eq(menuItems.id, id))
    .returning({ imagePath: menuItems.imagePath });
  await deleteImageUpload(deleted?.imagePath);
  revalidateMenu();
}

export async function saveCategoryAction(formData: FormData) {
  await requireOwner();

  const parsed = categorySchema.safeParse({
    ...Object.fromEntries(formData),
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid category");
  }

  const { id, ...values } = parsed.data;
  const db = getDb();
  if (id) {
    await db
      .update(menuCategories)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(menuCategories.id, id));
  } else {
    await db.insert(menuCategories).values({
      ...values,
      slug: await uniqueCategorySlug(slugify(values.name) || "category"),
    });
  }

  revalidateMenu();
}

export async function setFeaturedAction(formData: FormData) {
  await requireOwner();
  const id = z.string().uuid().parse(formData.get("id"));
  await getDb()
    .update(menuItems)
    .set({ featured: formData.get("featured") === "true", updatedAt: new Date() })
    .where(eq(menuItems.id, id));
  revalidateMenu();
}

export async function savePromotionAction(formData: FormData) {
  await requireOwner();

  const parsed = promotionSchema.safeParse({
    ...Object.fromEntries(formData),
    active: formData.get("active") === "on",
    removeImage: formData.get("removeImage") === "on",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid promotion");
  }

  const { id, endsOn, link, removeImage, ...values } = parsed.data;
  const db = getDb();
  const [existing] = id
    ? await db
        .select({ imagePath: promotions.imagePath })
        .from(promotions)
        .where(eq(promotions.id, id))
    : [];

  let imagePath = existing?.imagePath ?? null;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const upload = await saveImageUpload(image);
    if (!upload.ok) throw new Error(upload.error);
    imagePath = upload.path;
  } else if (removeImage) {
    imagePath = null;
  }

  const record = {
    ...values,
    endsOn: endsOn || null,
    link: link || null,
    imagePath,
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(promotions).set(record).where(eq(promotions.id, id));
  } else {
    await db.insert(promotions).values(record);
  }

  if (existing?.imagePath && existing.imagePath !== imagePath) {
    await deleteImageUpload(existing.imagePath);
  }

  revalidateMenu();
}

export async function setPromotionActiveAction(formData: FormData) {
  await requireOwner();
  const id = z.string().uuid().parse(formData.get("id"));
  await getDb()
    .update(promotions)
    .set({ active: formData.get("active") === "true", updatedAt: new Date() })
    .where(eq(promotions.id, id));
  revalidateMenu();
}

export async function deletePromotionAction(formData: FormData) {
  await requireOwner();
  const id = z.string().uuid().parse(formData.get("id"));
  const [deleted] = await getDb()
    .delete(promotions)
    .where(eq(promotions.id, id))
    .returning({ imagePath: promotions.imagePath });
  await deleteImageUpload(deleted?.imagePath);
  revalidateMenu();
}

// Creates a hidden draft from an Instagram post; the owner checks it and shows it.
export async function importInstagramPromotionAction(formData: FormData) {
  await requireOwner();
  const id = z.string().uuid().parse(formData.get("postId"));
  const db = getDb();
  const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, id));
  if (!post?.caption) throw new Error("Instagram post not found");

  const [already] = await db
    .select({ id: promotions.id })
    .from(promotions)
    .where(eq(promotions.link, post.permalink));
  if (!already) {
    await db.insert(promotions).values({
      ...promotionFromCaption(post.caption),
      link: post.permalink,
      active: false,
    });
  }
  revalidateMenu();
}

async function requireOwner() {
  if (!(await getCurrentOwner())) throw new Error("Unauthorized");
}

async function uniqueItemSlug(base: string, id?: string) {
  const db = getDb();
  for (let suffix = 1; ; suffix++) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;
    const [taken] = await db
      .select({ id: menuItems.id })
      .from(menuItems)
      .where(
        id
          ? and(eq(menuItems.slug, candidate), ne(menuItems.id, id))
          : eq(menuItems.slug, candidate),
      );
    if (!taken) return candidate;
  }
}

async function uniqueCategorySlug(base: string) {
  const db = getDb();
  for (let suffix = 1; ; suffix++) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;
    const [taken] = await db
      .select({ id: menuCategories.id })
      .from(menuCategories)
      .where(eq(menuCategories.slug, candidate));
    if (!taken) return candidate;
  }
}

function revalidateMenu() {
  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath("/admin");
}
