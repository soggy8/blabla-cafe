import { beforeEach, describe, expect, it, vi } from "vitest";
import { promotions } from "@/db/schema";
import { createTestDb } from "@/tests/support/db";
import { state } from "@/tests/support/mocks";

vi.mock("@/db/client", async () => (await import("@/tests/support/mocks")).dbModule);

const { getPromotions } = await import("./content");
const { todayInSkopje } = await import("./promotions");

beforeEach(async () => {
  state.db = await createTestDb();
});

describe("getPromotions", () => {
  it("shows visible promotions until their last day, with parsed offers", async () => {
    const today = todayInSkopje();
    await state.db!.insert(promotions).values([
      { title: "Без крај", description: "Фреш + еспресо – 160 ден." },
      { title: "Последен ден", endsOn: today },
      { title: "Истечена", endsOn: "2020-01-01" },
      { title: "Скриена", active: false },
    ]);

    const shown = await getPromotions();
    expect(shown.map((promotion) => promotion.title).sort()).toEqual(["Без крај", "Последен ден"]);
    expect(shown.find((promotion) => promotion.title === "Без крај")!.offers).toEqual([
      { label: "Фреш + еспресо", price: "160 ден." },
    ]);
  });
});
