import { describe, expect, it } from "vitest";
import {
  looksLikePromotion,
  parseOfferLines,
  promotionFromCaption,
  todayInSkopje,
} from "./promotions";

// Trimmed real captions from @blablacafe14.
const morning = [
  "☕🥤 УТРИНСКА ПРОМОЦИЈА ВО BLA BLA CAFE! 🥤☕",
  "Започнете го денот со совршена комбинација по специјални цени! 🤩",
  "🍊 Фреш + Еспресо – 160 ден.",
  "🥤 Сода + Макијато или Еспресо – 130 ден.",
  "⏰ Промоцијата важи секој ден до 15:00 часот.",
  "📍 BLA BLA CAFE – Маршал Тито 146, Струмица",
].join("\n");

const weekend = [
  "🍺🔥 ВИКЕНД ПРОМОЦИЈА ВО BLA BLA CAFE! 🔥🍺",
  "Овој викенд доброто друштво оди со ладно пиво и богата даска! 😍",
  "🍻 ПОНУДА 1:",
  "6 пива СКОПСКО или ЗЛАТЕН ДАБ + даска = 1.000 денари",
  "📅 Промоцијата важи за викенд!",
].join("\n");

const cocktails = [
  "🍹✨ Време е за коктел во BLA BLA CAFE! ✨🍹",
  "Освежи го денот и уживај во летните вечери со нашата богата понуда на коктели! 🌴🍸",
  "🍊 Aperol Spritz",
].join("\n");

describe("looksLikePromotion", () => {
  it("needs a promotion word and a price or a freebie", () => {
    expect(looksLikePromotion(morning)).toBe(true);
    expect(looksLikePromotion(weekend)).toBe(true);
    expect(looksLikePromotion("🎉 Промоции само кај нас:\n🍺 Tuborg 5+1 ГРАТИС")).toBe(true);
    expect(looksLikePromotion(cocktails)).toBe(false);
    expect(looksLikePromotion(null)).toBe(false);
  });
});

describe("promotionFromCaption", () => {
  it("turns a caption into a clean draft", () => {
    expect(promotionFromCaption(morning)).toEqual({
      title: "Утринска промоција",
      validity: "Секој ден до 15:00",
      description: "Фреш + Еспресо – 160 ден.\nСода + Макијато или Еспресо – 130 ден.",
    });
  });

  it("prefers the line that says when the offer is valid", () => {
    const draft = promotionFromCaption(weekend);
    expect(draft.title).toBe("Викенд промоција");
    expect(draft.validity).toBe("За викенд");
    expect(draft.description).toBe("6 пива СКОПСКО или ЗЛАТЕН ДАБ + даска = 1.000 денари");
  });

  it("strips the Cyrillic brand name and pulls the schedule out of a sentence", () => {
    const draft = promotionFromCaption(
      [
        "НОВИ КОМБИНАЦИИ СО СУПЕР ЦЕНИ ВО „БЛА БЛА КАФЕ“ ШТО МОРА ДА ГИ ПРОБАТЕ - ОД 08:00 ДО 15:00 ЧАСОТ! 🍊☕️",
        "Одлична понуда за совршен почеток на денот ве очекува во „БЛА БЛА КАФЕ“, секој ден од 08:00 до 15:00 часот!",
        "🍊 Фреш + еспресо – 160 денари",
      ].join("\n"),
    );
    expect(draft.title).toBe("Нови комбинации со супер цени што мора да ги пробате");
    expect(draft.validity).toBe("Секој ден од 08:00 до 15:00");
  });
});

describe("parseOfferLines", () => {
  it("splits name and price on the last separator", () => {
    expect(parseOfferLines("Фреш + еспресо – 160 ден.\n\nКока-Кола - макијато - 130 ден.\nTuborg 5+1 ГРАТИС")).toEqual([
      { label: "Фреш + еспресо", price: "160 ден." },
      { label: "Кока-Кола - макијато", price: "130 ден." },
      { label: "Tuborg 5+1 ГРАТИС" },
    ]);
  });

  it("keeps a line whole when the tail has no number", () => {
    expect(parseOfferLines("Кафе – по избор")).toEqual([{ label: "Кафе – по избор" }]);
  });
});

describe("todayInSkopje", () => {
  it("uses the Skopje calendar day", () => {
    expect(todayInSkopje(new Date("2026-10-18T22:30:00Z"))).toBe("2026-10-19");
  });
});
