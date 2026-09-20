import { describe, expect, it } from "vitest";
import { menuCategories, menuItems } from "./menu";

describe("prototype menu", () => {
  it("references only existing categories", () => {
    const categoryIds = new Set(menuCategories.map((category) => category.id));
    expect(menuItems.every((item) => categoryIds.has(item.categoryId))).toBe(true);
  });

  it("has unique item and category identifiers", () => {
    expect(new Set(menuItems.map((item) => item.id)).size).toBe(menuItems.length);
    expect(new Set(menuCategories.map((category) => category.id)).size).toBe(
      menuCategories.length,
    );
  });

  it("never publishes a non-positive price", () => {
    expect(
      menuItems
        .filter((item) => item.price !== undefined)
        .every((item) => item.price! > 0),
    ).toBe(true);
  });
});
