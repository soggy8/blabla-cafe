import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("transliterates Macedonian Cyrillic", () => {
    expect(slugify("Турско кафе")).toBe("tursko-kafe");
    expect(slugify("Свежо цедени сокови")).toBe("svezho-cedeni-sokovi");
    expect(slugify("Ѓеврек со џем")).toBe("gjevrek-so-dzhem");
  });

  it("keeps latin names and strips punctuation", () => {
    expect(slugify("Aperol Spritz!")).toBe("aperol-spritz");
    expect(slugify("  Coca-Cola 0,25l ")).toBe("coca-cola-0-25l");
  });

  it("returns an empty string when nothing is usable", () => {
    expect(slugify("☕")).toBe("");
  });
});
