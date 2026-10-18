import { beforeEach, describe, expect, it, vi } from "vitest";
import { hash } from "@node-rs/argon2";
import { loginAttempts, owners, sessions } from "@/db/schema";
import { createTestDb } from "@/tests/support/db";
import { state } from "@/tests/support/mocks";

vi.mock("@/db/client", async () => (await import("@/tests/support/mocks")).dbModule);
vi.mock("next/headers", async () => (await import("@/tests/support/mocks")).headersModule);

const { authenticateOwner, changeOwnerPassword, getCurrentOwner, logoutOwner } =
  await import("./auth");


const COOKIE = "blabla_owner_session";
let ownerId: string;

beforeEach(async () => {
  state.db = await createTestDb();
  state.cookies.clear();
  const [owner] = await state.db
    .insert(owners)
    .values({ email: "owner@example.com", passwordHash: await hash("correct-horse-battery") })
    .returning();
  ownerId = owner.id;
});

describe("authenticateOwner", () => {
  it("logs in with correct credentials and sets a session cookie", async () => {
    const result = await authenticateOwner("Owner@Example.com ", "correct-horse-battery", "1.1.1.1");
    expect(result.ok).toBe(true);
    expect(state.cookies.get(COOKIE)).toBeTruthy();
    expect(await getCurrentOwner()).toMatchObject({ id: ownerId, email: "owner@example.com" });
  });

  it("stores only a hash of the session token", async () => {
    await authenticateOwner("owner@example.com", "correct-horse-battery", "1.1.1.1");
    const [row] = await state.db!.select().from(sessions);
    expect(row.tokenHash).not.toBe(state.cookies.get(COOKIE));
    expect(row.tokenHash).toHaveLength(64);
  });

  it("rejects wrong passwords and unknown accounts with the same reason", async () => {
    const wrong = await authenticateOwner("owner@example.com", "nope-nope-nope", "1.1.1.1");
    const unknown = await authenticateOwner("who@example.com", "nope-nope-nope", "1.1.1.1");
    expect(wrong).toEqual({ ok: false, reason: "credentials" });
    expect(unknown).toEqual({ ok: false, reason: "credentials" });
    expect(state.cookies.has(COOKIE)).toBe(false);
  });

  it("blocks an address after 5 failures, even with the right password", async () => {
    for (let i = 0; i < 5; i++) {
      await authenticateOwner("owner@example.com", "wrong-password", "9.9.9.9");
    }
    const result = await authenticateOwner("owner@example.com", "correct-horse-battery", "9.9.9.9");
    expect(result).toEqual({ ok: false, reason: "blocked" });
  });

  it("cannot be bypassed by rotating addresses against one account", async () => {
    for (let i = 0; i < 20; i++) {
      await authenticateOwner("owner@example.com", "wrong-password", `10.0.0.${i}`);
    }
    const result = await authenticateOwner("owner@example.com", "correct-horse-battery", "10.0.1.1");
    expect(result).toEqual({ ok: false, reason: "blocked" });
  });

  it("does not let one address's failures block a different address on few attempts", async () => {
    for (let i = 0; i < 5; i++) {
      await authenticateOwner("owner@example.com", "wrong-password", "9.9.9.9");
    }
    const result = await authenticateOwner("owner@example.com", "correct-horse-battery", "8.8.8.8");
    expect(result.ok).toBe(true);
  });

  it("lets the block expire", async () => {
    for (let i = 0; i < 5; i++) {
      await authenticateOwner("owner@example.com", "wrong-password", "9.9.9.9");
    }
    await state.db!
      .update(loginAttempts)
      .set({ blockedUntil: new Date(Date.now() - 1000) });
    const result = await authenticateOwner("owner@example.com", "correct-horse-battery", "9.9.9.9");
    expect(result.ok).toBe(true);
  });

  it("clears failure counters after a successful login", async () => {
    await authenticateOwner("owner@example.com", "wrong-password", "1.1.1.1");
    await authenticateOwner("owner@example.com", "correct-horse-battery", "1.1.1.1");
    expect(await state.db!.select().from(loginAttempts)).toHaveLength(0);
  });
});

describe("sessions", () => {
  it("rejects missing, unknown and expired tokens", async () => {
    expect(await getCurrentOwner()).toBeNull();
    state.cookies.set(COOKIE, "forged");
    expect(await getCurrentOwner()).toBeNull();

    state.cookies.clear();
    await authenticateOwner("owner@example.com", "correct-horse-battery", "1.1.1.1");
    await state.db!.update(sessions).set({ expiresAt: new Date(Date.now() - 1000) });
    expect(await getCurrentOwner()).toBeNull();
  });

  it("logout revokes the session server-side", async () => {
    await authenticateOwner("owner@example.com", "correct-horse-battery", "1.1.1.1");
    const token = state.cookies.get(COOKIE)!;
    await logoutOwner();
    expect(state.cookies.has(COOKIE)).toBe(false);
    state.cookies.set(COOKIE, token);
    expect(await getCurrentOwner()).toBeNull();
  });
});

describe("changeOwnerPassword", () => {
  it("requires the current password", async () => {
    expect(await changeOwnerPassword(ownerId, "wrong", "a-brand-new-password")).toBe(false);
  });

  it("changes the password and revokes other sessions but keeps this one", async () => {
    await authenticateOwner("owner@example.com", "correct-horse-battery", "1.1.1.1");
    const mine = state.cookies.get(COOKIE)!;
    state.cookies.clear();
    await authenticateOwner("owner@example.com", "correct-horse-battery", "2.2.2.2");
    const other = state.cookies.get(COOKIE)!;

    state.cookies.set(COOKIE, mine);
    expect(await changeOwnerPassword(ownerId, "correct-horse-battery", "a-brand-new-password")).toBe(true);

    expect(await getCurrentOwner()).not.toBeNull();
    state.cookies.set(COOKIE, other);
    expect(await getCurrentOwner()).toBeNull();

    state.cookies.clear();
    expect((await authenticateOwner("owner@example.com", "correct-horse-battery", "3.3.3.3")).ok).toBe(false);
    expect((await authenticateOwner("owner@example.com", "a-brand-new-password", "3.3.3.3")).ok).toBe(true);
  });
});

it("fails closed without a database", async () => {
  state.db = null;
  expect(await authenticateOwner("a@b.c", "x", "1.1.1.1")).toEqual({ ok: false, reason: "database" });
  expect(await getCurrentOwner()).toBeNull();
});
