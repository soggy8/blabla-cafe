import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { verify } from "@node-rs/argon2";
import { menuCategories as seedCategories, menuItems as seedItems } from "@/data/menu";
import { menuCategories, menuItems, owners, sessions } from "@/db/schema";
import { createTestDb, type TestDb } from "@/tests/support/db";
import { ensureOwner, seedMenuIfEmpty } from "./bootstrap";

let db: TestDb;
beforeEach(async () => {
  db = await createTestDb();
});

describe("seedMenuIfEmpty", () => {
  it("seeds the bundled menu once", async () => {
    expect(await seedMenuIfEmpty(db)).toBe(true);
    expect(await db.select().from(menuCategories)).toHaveLength(seedCategories.length);
    expect(await db.select().from(menuItems)).toHaveLength(seedItems.length);
    expect(await seedMenuIfEmpty(db)).toBe(false);
    expect(await db.select().from(menuItems)).toHaveLength(seedItems.length);
  });

  it("never overwrites edits made in the dashboard", async () => {
    await seedMenuIfEmpty(db);
    await db.update(menuItems).set({ price: 999 }).where(eq(menuItems.slug, seedItems[0].id));
    await seedMenuIfEmpty(db);
    const [row] = await db.select().from(menuItems).where(eq(menuItems.slug, seedItems[0].id));
    expect(row.price).toBe(999);
  });
});

describe("ensureOwner", () => {
  const env = { email: " Owner@Example.com", password: "initial-password-123" };

  it("skips without credentials", async () => {
    expect(await ensureOwner(db, {})).toBe("skipped");
    expect(await ensureOwner(db, { email: "a@b.c" })).toBe("skipped");
  });

  it("creates the owner once with a hashed, lower-cased identity", async () => {
    expect(await ensureOwner(db, env)).toBe("created");
    expect(await ensureOwner(db, env)).toBe("exists");
    const rows = await db.select().from(owners);
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("owner@example.com");
    expect(rows[0].passwordHash).toMatch(/^\$argon2id\$/);
  });

  it("does not change the password of an existing owner on restart", async () => {
    await ensureOwner(db, env);
    await ensureOwner(db, { ...env, password: "different-password-9" });
    const [row] = await db.select().from(owners);
    expect(await verify(row.passwordHash, env.password)).toBe(true);
  });

  it("resets the password and revokes sessions when asked", async () => {
    await ensureOwner(db, env);
    const [owner] = await db.select().from(owners);
    await db.insert(sessions).values({ ownerId: owner.id, tokenHash: "t", expiresAt: new Date(Date.now() + 1e6) });

    expect(await ensureOwner(db, { ...env, password: "recovered-password-9", reset: true })).toBe("reset");
    const [row] = await db.select().from(owners);
    expect(await verify(row.passwordHash, "recovered-password-9")).toBe(true);
    expect(await db.select().from(sessions)).toHaveLength(0);
  });
});
