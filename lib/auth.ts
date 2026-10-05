import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { and, eq, gt, isNull, lt, ne, or } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb, hasDatabase } from "@/db/client";
import { loginAttempts, owners, sessions } from "@/db/schema";

const SESSION_COOKIE = "blabla_owner_session";
const SESSION_DAYS = 14;
const MAX_ATTEMPTS = 5;
const BLOCK_MINUTES = 15;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function authenticateOwner(
  email: string,
  password: string,
  throttleKey: string,
) {
  if (!hasDatabase()) {
    return { ok: false as const, reason: "database" as const };
  }

  const db = getDb();
  const now = new Date();
  const [attempt] = await db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.key, throttleKey))
    .limit(1);

  if (attempt?.blockedUntil && attempt.blockedUntil > now) {
    return { ok: false as const, reason: "blocked" as const };
  }

  const [owner] = await db
    .select()
    .from(owners)
    .where(eq(owners.email, email.trim().toLowerCase()))
    .limit(1);

  const valid = owner ? await verify(owner.passwordHash, password) : false;
  if (!owner || !valid) {
    const attempts = (attempt?.attempts ?? 0) + 1;
    const blockedUntil =
      attempts >= MAX_ATTEMPTS
        ? new Date(Date.now() + BLOCK_MINUTES * 60 * 1000)
        : null;

    await db
      .insert(loginAttempts)
      .values({ key: throttleKey, attempts, blockedUntil, updatedAt: now })
      .onConflictDoUpdate({
        target: loginAttempts.key,
        set: { attempts, blockedUntil, updatedAt: now },
      });
    return { ok: false as const, reason: "credentials" as const };
  }

  await db.delete(loginAttempts).where(eq(loginAttempts.key, throttleKey));
  await deleteStaleAuthRows();

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({
    ownerId: owner.id,
    tokenHash: hashToken(token),
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return { ok: true as const };
}

export async function getCurrentOwner() {
  if (!hasDatabase()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = getDb();
  const [result] = await db
    .select({ id: owners.id, email: owners.email })
    .from(sessions)
    .innerJoin(owners, eq(sessions.ownerId, owners.id))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return result ?? null;
}

export async function changeOwnerPassword(
  ownerId: string,
  currentPassword: string,
  newPassword: string,
) {
  const db = getDb();
  const [owner] = await db
    .select({ passwordHash: owners.passwordHash })
    .from(owners)
    .where(eq(owners.id, ownerId))
    .limit(1);
  if (!owner || !(await verify(owner.passwordHash, currentPassword))) {
    return false;
  }

  await db
    .update(owners)
    .set({ passwordHash: await hash(newPassword) })
    .where(eq(owners.id, ownerId));

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await db
    .delete(sessions)
    .where(
      token
        ? and(eq(sessions.ownerId, ownerId), ne(sessions.tokenHash, hashToken(token)))
        : eq(sessions.ownerId, ownerId),
    );
  return true;
}

async function deleteStaleAuthRows() {
  const db = getDb();
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  await db.delete(sessions).where(lt(sessions.expiresAt, now));
  await db
    .delete(loginAttempts)
    .where(
      and(
        lt(loginAttempts.updatedAt, dayAgo),
        or(isNull(loginAttempts.blockedUntil), lt(loginAttempts.blockedUntil, now)),
      ),
    );
}

export async function logoutOwner() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token && hasDatabase()) {
    await getDb()
      .delete(sessions)
      .where(eq(sessions.tokenHash, hashToken(token)));
    await deleteStaleAuthRows();
  }
  cookieStore.delete(SESSION_COOKIE);
}
