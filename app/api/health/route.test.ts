import { describe, expect, it, vi } from "vitest";
import { state } from "@/tests/support/mocks";
import { createTestDb } from "@/tests/support/db";

vi.mock("@/db/client", async () => (await import("@/tests/support/mocks")).dbModule);
const { GET } = await import("./route");

describe("GET /api/health", () => {
  it("is ok without a database (public-only mode)", async () => {
    state.db = null;
    expect(await (await GET()).json()).toEqual({ ok: true, database: false });
  });

  it("is ok with a reachable database", async () => {
    state.db = await createTestDb();
    expect(await (await GET()).json()).toEqual({ ok: true, database: true });
  });

  it("returns 503 when the database query fails", async () => {
    state.db = {
      execute: async () => {
        throw new Error("down");
      },
    } as never;
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ ok: false, database: false });
  });
});
