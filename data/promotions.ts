export type PromotionSeed = {
  title: string;
  validity: string;
  description: string;
  link: string;
  active: boolean;
};

// Placeholders taken from @blablacafe14 posts (Aug–Sep 2026). Seeded once on first
// start; the owner edits, hides or deletes them from the admin panel.
export const promotionSeeds: PromotionSeed[] = [
  {
    title: "Утринска промоција",
    validity: "Секој ден до 15:00",
    description: [
      "Фреш + еспресо – 160 ден.",
      "Сода + макијато или еспресо – 130 ден.",
      "Кока-Кола + макијато – 130 ден.",
    ].join("\n"),
    link: "https://www.instagram.com/p/DbrQRLHjGqY/",
    active: true,
  },
  {
    title: "Училишна понуда",
    validity: "Секој ден 08:00–17:00",
    description: [
      "Еспресо – 60 ден.",
      "Макијато – 70 ден.",
      "Свежо цеден сок – 120 ден.",
      "Мал тост – 60 ден.",
      "Голем тост – 90 ден.",
    ].join("\n"),
    link: "https://www.instagram.com/p/DdCPE06M4xf/",
    active: true,
  },
  {
    title: "Викенд: пиво и даска",
    validity: "Викенд",
    description: [
      "6 Скопско или Златен Даб + даска – 1.000 ден.",
      "6 Tuborg + даска – 1.100 ден.",
    ].join("\n"),
    link: "https://www.instagram.com/p/DbxYDw7jH67/",
    active: false,
  },
];
