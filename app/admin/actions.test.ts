import { eq } from "drizzle-orm";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hash } from "@node-rs/argon2";
import { menuCategories, menuItems, owners } from "@/db/schema";
import { seedMenuIfEmpty } from "@/lib/bootstrap";
import { createTestDb } from "@/tests/support/db";
import { state } from "@/tests/support/mocks";

vi.mock("@/db/client", async () => (await import("@/tests/support/mocks")).dbModule);
vi.mock("next/headers", async () => (await import("@/tests/support/mocks")).headersModule);
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

const actions = await import("./actions");
const { authenticateOwner } = await import("@/lib/auth");

let dir: string;
const form = (values: Record<string, string | File>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
};

async function login() {
  await authenticateOwner("owner@example.com", "correct-horse-battery", "1.1.1.1");
}

beforeEach(async () => {
  state.db = await createTestDb();
  state.cookies.clear();
  state.headers = new Headers({ "x-forwarded-for": "203.0.113.5" });
  dir = await mkdtemp(path.join(os.tmpdir(), "act-"));
  process.env.UPLOAD_DIR = dir;
  await state.db.insert(owners).values({
    email: "owner@example.com",
    passwordHash: await hash("correct-horse-battery"),
  });
  await seedMenuIfEmpty(state.db);
});
afterEach(async () => {
  delete process.env.UPLOAD_DIR;
  await rm(dir, { recursive: true, force: true });
});

describe("authorization", () => {
  it("rejects every mutation without a session", async () => {
    const [category] = await state.db!.select().from(menuCategories);
    const [item] = await state.db!.select().from(menuItems);
    const before = await state.db!.select().from(menuItems);

    await expect(actions.saveMenuItemAction(form({ categoryId: category.id, name: "Hack", sortOrder: "0" }))).rejects.toThrow("Unauthorized");
    await expect(actions.deleteMenuItemAction(form({ id: item.id }))).rejects.toThrow("Unauthorized");
    await expect(actions.saveCategoryAction(form({ name: "Hack", sortOrder: "0" }))).rejects.toThrow("Unauthorized");
    expect(await state.db!.select().from(menuItems)).toHaveLength(before.length);
  });
});

describe("loginAction", () => {
  it("redirects to /admin on success", async () => {
    await expect(
      actions.loginAction({}, form({ email: "owner@example.com", password: "correct-horse-battery" })),
    ).rejects.toThrow("REDIRECT:/admin");
  });

  it("returns a generic error for bad credentials and validates input", async () => {
    expect(await actions.loginAction({}, form({ email: "owner@example.com", password: "wrong-password" }))).toHaveProperty("error");
    expect(await actions.loginAction({}, form({ email: "not-an-email", password: "x" }))).toHaveProperty("error");
  });

  it("is not bypassed by forging the leading X-Forwarded-For entries", async () => {
    for (let i = 0; i < 5; i++) {
      state.headers = new Headers({ "x-forwarded-for": `1.2.3.${i}, 203.0.113.5` });
      await actions.loginAction({}, form({ email: "owner@example.com", password: "wrong-password" }));
    }
    state.headers = new Headers({ "x-forwarded-for": "9.9.9.9, 203.0.113.5" });
    const result = await actions.loginAction({}, form({ email: "owner@example.com", password: "correct-horse-battery" }));
    expect(result).toMatchObject({ error: expect.stringContaining("Премногу") });
  });
});

describe("changePasswordAction", () => {
  it("redirects to login when signed out", async () => {
    await expect(
      actions.changePasswordAction({}, form({ currentPassword: "a", newPassword: "b".repeat(12), confirmPassword: "b".repeat(12) })),
    ).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("enforces length, confirmation, difference and current password", async () => {
    await login();
    const submit = (v: Record<string, string>) => actions.changePasswordAction({}, form(v));
    expect(await submit({ currentPassword: "correct-horse-battery", newPassword: "short", confirmPassword: "short" })).toHaveProperty("error");
    expect(await submit({ currentPassword: "correct-horse-battery", newPassword: "x".repeat(12), confirmPassword: "y".repeat(12) })).toHaveProperty("error");
    expect(await submit({ currentPassword: "correct-horse-battery", newPassword: "correct-horse-battery", confirmPassword: "correct-horse-battery" })).toHaveProperty("error");
    expect(await submit({ currentPassword: "wrong-current-pw", newPassword: "a-brand-new-password", confirmPassword: "a-brand-new-password" })).toHaveProperty("error");
    expect(await submit({ currentPassword: "correct-horse-battery", newPassword: "a-brand-new-password", confirmPassword: "a-brand-new-password" })).toEqual({ success: true });
  });
});

describe("menu item actions", () => {
  beforeEach(login);

  it("creates an item with a generated unique slug", async () => {
    const [category] = await state.db!.select().from(menuCategories);
    const make = () =>
      actions.saveMenuItemAction(form({ categoryId: category.id, name: "Нов кафе", description: "d", price: "120", sortOrder: "5", featured: "on" }));
    await make();
    await make();
    const rows = await state.db!.select().from(menuItems);
    const created = rows.filter((row) => row.name === "Нов кафе");
    expect(created).toHaveLength(2);
    expect(new Set(created.map((row) => row.slug)).size).toBe(2);
    expect(created[0]).toMatchObject({ price: 120, featured: true, available: false });
  });

  it("rejects invalid input", async () => {
    const [category] = await state.db!.select().from(menuCategories);
    await expect(actions.saveMenuItemAction(form({ categoryId: category.id, name: "x", sortOrder: "0" }))).rejects.toThrow();
    await expect(actions.saveMenuItemAction(form({ categoryId: category.id, name: "Valid", price: "-5", sortOrder: "0" }))).rejects.toThrow();
    await expect(actions.saveMenuItemAction(form({ categoryId: "nope", name: "Valid", sortOrder: "0" }))).rejects.toThrow();
  });

  it("stores an uploaded photo, then removes the file when the photo is replaced or the item deleted", async () => {
    const [category] = await state.db!.select().from(menuCategories);
    const photo = async () =>
      new File([new Uint8Array(await sharp({ create: { width: 9, height: 9, channels: 3, background: "#123" } }).png().toBuffer())], "p.png", { type: "image/png" });

    await actions.saveMenuItemAction(form({ categoryId: category.id, name: "С фотографија", sortOrder: "1", image: await photo() }));
    const [item] = await state.db!.select().from(menuItems).where(eq(menuItems.name, "С фотографија"));
    expect(item.imagePath).toMatch(/^\/media\//);
    expect(await readdir(dir)).toHaveLength(1);

    await actions.saveMenuItemAction(form({ id: item.id, categoryId: category.id, name: "С фотографија", sortOrder: "1", image: await photo() }));
    expect(await readdir(dir)).toHaveLength(1);

    await actions.saveMenuItemAction(form({ id: item.id, categoryId: category.id, name: "С фотографија", sortOrder: "1", removeImage: "on" }));
    expect(await readdir(dir)).toHaveLength(0);

    await actions.saveMenuItemAction(form({ id: item.id, categoryId: category.id, name: "С фотографија", sortOrder: "1", image: await photo() }));
    await actions.deleteMenuItemAction(form({ id: item.id }));
    expect(await readdir(dir)).toHaveLength(0);
    expect(await state.db!.select().from(menuItems).where(eq(menuItems.id, item.id))).toHaveLength(0);
  });

  it("surfaces upload failures instead of saving a broken item", async () => {
    const [category] = await state.db!.select().from(menuCategories);
    await expect(
      actions.saveMenuItemAction(form({ categoryId: category.id, name: "Лоша слика", sortOrder: "1", image: new File(["junk"], "p.png", { type: "image/png" }) })),
    ).rejects.toThrow();
    expect(await state.db!.select().from(menuItems).where(eq(menuItems.name, "Лоша слика"))).toHaveLength(0);
  });
});

describe("category actions", () => {
  beforeEach(login);

  it("creates, renames and hides a category", async () => {
    await actions.saveCategoryAction(form({ name: "Десерти", eyebrow: "Слатко", sortOrder: "9", active: "on" }));
    const [created] = await state.db!.select().from(menuCategories).where(eq(menuCategories.name, "Десерти"));
    expect(created.slug).toBeTruthy();

    await actions.saveCategoryAction(form({ id: created.id, name: "Слатки", eyebrow: "", sortOrder: "9" }));
    const [updated] = await state.db!.select().from(menuCategories).where(eq(menuCategories.id, created.id));
    expect(updated).toMatchObject({ name: "Слатки", active: false, slug: created.slug });
  });

  it("rejects a too-short name", async () => {
    await expect(actions.saveCategoryAction(form({ name: "x", sortOrder: "0" }))).rejects.toThrow();
  });
});

describe("logoutAction", () => {
  it("ends the session and redirects", async () => {
    await login();
    await expect(actions.logoutAction()).rejects.toThrow("REDIRECT:/admin/login");
    expect(state.cookies.size).toBe(0);
  });
});
