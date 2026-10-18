export type OfferLine = { label: string; price?: string };

const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\uFE0F\u200D\u20E3]/gu;
const PRICE = /\d[\d.,]*\s*(ден|мкд)/iu;
const FREEBIE = /гратис|\d\s*\+\s*1\b/iu;
const PROMO_WORD = /промоциј|понуд|акциј|попуст|гратис/iu;
const VALIDITY = /важи|секој ден|викенд|(^|\s)(од|до)\s+\d{1,2}[:.]\d{2}/iu;
// "секој ден од 08:00 до 17:00" out of a longer sentence.
const SCHEDULE = /(секој ден\s+)?(од\s+\d{1,2}[:.]\d{2}\s+)?до\s+\d{1,2}[:.]\d{2}/iu;
// The cafe's own name, which is redundant in a title on its own website.
const BRAND = /\s+(во|in)\s+[„"]?(bla\s*bla|бла\s*бла)(\s*(cafe|кафе))?[“"]?/iu;
// The last " – ", " — ", " - " or " = " splits an offer into name and price.
const SEPARATOR = /\s+[–—=-]\s+(?!.*\s[–—=-]\s)/u;

export function parseOfferLines(description: string): OfferLine[] {
  return description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = SEPARATOR.exec(line);
      if (!match) return { label: line };
      const price = line.slice(match.index + match[0].length).trim();
      if (!/\d/.test(price)) return { label: line };
      return { label: line.slice(0, match.index).trim(), price };
    });
}

// Today's date in Skopje as YYYY-MM-DD, for comparing with `ends_on`.
export function todayInSkopje(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Skopje" }).format(now);
}

function cleanLine(line: string) {
  return line
    .replace(EMOJI, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[-–—•|:]+\s*/, "");
}

function sentenceCase(text: string) {
  if (text !== text.toLocaleUpperCase("mk")) return text;
  const lower = text.toLocaleLowerCase("mk");
  return lower.charAt(0).toLocaleUpperCase("mk") + lower.slice(1);
}

export function looksLikePromotion(caption: string | null | undefined) {
  if (!caption) return false;
  return PROMO_WORD.test(caption) && (PRICE.test(caption) || FREEBIE.test(caption));
}

// Best-effort draft from an Instagram caption; the owner reviews it before showing it.
export function promotionFromCaption(caption: string) {
  const lines = caption.split("\n").map(cleanLine).filter(Boolean);
  const [first = "Промоција", ...rest] = lines;

  const title =
    sentenceCase(first)
      .replace(BRAND, "")
      .split(/\s+[-–—|]\s+/u)[0]
      .replace(/[!.,:]+$/u, "")
      .trim()
      .slice(0, 100) || "Промоција";

  const candidates = rest.filter((line) => VALIDITY.test(line) && !PRICE.test(line));
  const validityLine = candidates.find((line) => /важи/iu.test(line)) ?? candidates[0];
  const validity = validityLine
    ? (() => {
        const text = (SCHEDULE.exec(validityLine)?.[0] ?? validityLine)
          .replace(/^(понудата|промоцијата|акцијата)\s+важи\s+/iu, "")
          .replace(/[!.]+$/u, "");
        return (text.charAt(0).toLocaleUpperCase("mk") + text.slice(1)).slice(0, 80);
      })()
    : "";

  const description = rest
    .filter((line) => line !== validityLine && (PRICE.test(line) || FREEBIE.test(line)))
    .join("\n")
    .slice(0, 600);

  return { title, validity, description };
}
