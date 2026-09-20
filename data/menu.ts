export type MenuCategory = {
  id: string;
  name: string;
  eyebrow: string;
  order: number;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price?: number;
  badge?: "Ново" | "Ритуал" | "Понуда";
  featured?: boolean;
  available: boolean;
};

export const menuCategories: MenuCategory[] = [
  { id: "coffee", name: "Кафе", eyebrow: "Секое утро започнува тука", order: 1 },
  { id: "cold", name: "Ладни пијалаци", eyebrow: "Свежо и разладено", order: 2 },
  { id: "food", name: "Залак", eyebrow: "За пауза што трае подолго", order: 3 },
  { id: "evening", name: "Вечерна понуда", eyebrow: "За добра дружба", order: 4 },
];

export const menuItems: MenuItem[] = [
  {
    id: "espresso",
    categoryId: "coffee",
    name: "Еспресо",
    description: "Кратко, интензивно и подготвено со прецизност.",
    price: 60,
    featured: true,
    available: true,
  },
  {
    id: "macchiato",
    categoryId: "coffee",
    name: "Макијато",
    description: "Еспресо омекнато со допир млечна пена.",
    price: 70,
    available: true,
  },
  {
    id: "sand-coffee",
    categoryId: "coffee",
    name: "Кафе на песок",
    description: "Во џезве на жежок песок, послужено со локум и вода.",
    badge: "Ритуал",
    featured: true,
    available: true,
  },
  {
    id: "iced-vanilla",
    categoryId: "cold",
    name: "Iced Vanilla Latte",
    description: "Ладно кафе, ванила и кремаста млечна текстура.",
    badge: "Ново",
    available: true,
  },
  {
    id: "raspberry-fredo",
    categoryId: "cold",
    name: "Fredo малина",
    description: "Кремасто Fredo капучино со освежителна нота на малина.",
    badge: "Ново",
    featured: true,
    available: true,
  },
  {
    id: "fresh-juice",
    categoryId: "cold",
    name: "Свежо цеден сок",
    description: "Цеден по нарачка за вистинска свежина.",
    price: 120,
    available: true,
  },
  {
    id: "small-toast",
    categoryId: "food",
    name: "Мал тост",
    description: "Топол, крцкав и подготвен за брза пауза.",
    price: 60,
    available: true,
  },
  {
    id: "large-toast",
    categoryId: "food",
    name: "Голем тост",
    description: "Поголем залак за долг ден.",
    price: 90,
    featured: true,
    available: true,
  },
  {
    id: "cocktails",
    categoryId: "evening",
    name: "Коктели",
    description: "Авторски и класични коктели за летни вечери.",
    available: true,
  },
  {
    id: "beer-board-1",
    categoryId: "evening",
    name: "6 пива + даска",
    description: "Скопско или Златен Даб со богата даска за друштво.",
    price: 1000,
    badge: "Понуда",
    available: true,
  },
  {
    id: "beer-board-2",
    categoryId: "evening",
    name: "6 Tuborg + даска",
    description: "Шест ладни Tuborg пива со даска.",
    price: 1100,
    badge: "Понуда",
    available: true,
  },
];

export const socialPosts = [
  {
    id: "school-offer",
    title: "Училишна понуда",
    date: "8 септември",
    href: "https://www.instagram.com/blablacafe14/p/DdCPE06M4xf/",
    kind: "offer",
  },
  {
    id: "sand-coffee",
    title: "Традиционално кафе на песок",
    date: "22 август",
    href: "https://www.instagram.com/blablacafe14/p/DcWfBupDLFi/",
    kind: "ritual",
  },
  {
    id: "weekend",
    title: "Викенд промоција",
    date: "7 август",
    href: "https://www.instagram.com/blablacafe14/p/Dbvb9BcjIGC/",
    kind: "night",
  },
] as const;
