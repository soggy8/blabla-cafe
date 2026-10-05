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
  image?: string;
  featured?: boolean;
  available: boolean;
};

export const menuCategories: MenuCategory[] = [
  { id: "hot-drinks", name: "Топли напитоци", eyebrow: "Секое утро започнува тука", order: 1 },
  { id: "ice-cream", name: "Сладолед", eyebrow: "Нешто слатко", order: 2 },
  { id: "snacks", name: "Апетисани", eyebrow: "За муабетот", order: 3 },
  { id: "water", name: "Вода", eyebrow: "Чисто и ладно", order: 4 },
  { id: "thick-juices", name: "Густи сокови", eyebrow: "Bravo · 0,25 л", order: 5 },
  { id: "fresh-juices", name: "Свежо цедени сокови", eyebrow: "Цедени по нарачка", order: 6 },
  { id: "sodas", name: "Газирани сокови", eyebrow: "0,25 л", order: 7 },
  { id: "beer", name: "Пиво", eyebrow: "0,33 л", order: 8 },
  { id: "cocktails", name: "Коктели", eyebrow: "За добра вечер", order: 9 },
  { id: "spirits", name: "Жестоки пијалоци", eyebrow: "Чисто или со мраз", order: 10 },
  { id: "wine", name: "Вино", eyebrow: "0,18 л", order: 11 },
  { id: "soft-drinks", name: "Свежи напитоци", eyebrow: "Разладување", order: 12 },
  { id: "aperitifs", name: "Аперитиви", eyebrow: "Пред или после", order: 13 },
];

type Row = [id: string, name: string, price: number, description?: string, extra?: Partial<MenuItem>];

const group = (categoryId: string, rows: Row[]): MenuItem[] =>
  rows.map(([id, name, price, description = "", extra]) => ({
    id,
    categoryId,
    name,
    description,
    price,
    available: true,
    ...extra,
  }));

export const menuItems: MenuItem[] = [
  ...group("hot-drinks", [
    ["espresso", "Еспресо", 80, "Кратко, интензивно и подготвено со прецизност.", { featured: true, image: "/media/featured-espresso.webp" }],
    ["macchiato-small", "Макијато мало", 90],
    ["macchiato-large", "Макијато големо", 100],
    ["americano", "Американо", 80],
    ["irish-coffee", "Ирско кафе", 130],
    ["cocoa", "Какао", 120],
    ["cappuccino", "Капучино", 110],
    ["nescafe", "Нес кафе", 110],
    ["turkish-coffee", "Турско кафе", 100, "Традиционално, бавно сварено во џезве.", { featured: true, image: "/media/featured-turkish-coffee.webp" }],
    ["freddo-espresso", "Фредо еспресо", 120],
    ["freddo-cappuccino", "Фредо капучино", 120, "Ладно еспресо со кремаста млечна пена.", { featured: true, image: "/media/featured-freddo-cappuccino.webp" }],
    ["hot-chocolate", "Топло чоколадо", 130, "Бело или црно"],
    ["tea", "Чај", 70, "Камилица, нане или овошен"],
  ]),
  ...group("ice-cream", [
    ["ice-cream-jar", "Тегличка", 160, "Брисел, Берлин, Лондон, Истанбул или Њујорк"],
    ["ice-cream-scoop", "Топка", 60, "Ванила, чоколадо, нугат или шумско овошје"],
  ]),
  ...group("snacks", [
    ["almonds", "Бадеми", 190, "100 г"],
    ["hazelnuts", "Лешници", 190, "100 г"],
    ["pistachios", "Ф'стаци", 190, "100 г"],
    ["cold-platter", "Ладна даска", 800, "400 г"],
  ]),
  ...group("water", [
    ["still-water", "Ладна вода", 70, "0,25 л"],
    ["aktiv", "Актив", 80, "0,33 л"],
    ["wellness", "Wellness", 80, "0,33 л"],
    ["balans", "Balans", 80, "0,33 л"],
    ["knjaz-milos", "Књаз Милош", 70, "0,25 л"],
    ["aqua-viva", "Аква Вива", 70, "0,25 л"],
  ]),
  ...group("thick-juices", [
    ["bravo-blueberry", "Bravo боровница", 100],
    ["bravo-apple", "Bravo јаболко", 100],
    ["bravo-orange", "Bravo портокал", 100],
    ["bravo-peach", "Bravo праска", 100],
    ["bravo-strawberry", "Bravo јагода", 100],
  ]),
  ...group("fresh-juices", [
    ["fresh-mix", "Фреш микс", 160],
    ["fresh-lemon", "Фреш лимон", 160],
    ["fresh-orange", "Фреш портокал", 160],
  ]),
  ...group("sodas", [
    ["coca-cola", "Coca-Cola", 90],
    ["pepsi", "Pepsi", 90],
    ["pepsi-zero", "Pepsi Zero", 90],
    ["seven-up", "7UP", 90],
    ["sprite", "Sprite", 90],
    ["fanta", "Fanta", 90],
    ["schweppes-bitter-lemon", "Schweppes Bitter Lemon", 100],
    ["schweppes-tonic", "Schweppes Tonic", 100],
  ]),
  ...group("beer", [
    ["amstel", "Amstel", 130],
    ["zlaten-dab", "Златен Даб", 120],
    ["skopsko", "Скопско", 110],
    ["skopsko-smooth", "Скопско Smooth", 110],
    ["tuborg", "Tuborg", 130],
    ["amber", "Amber", 130],
    ["carlsberg", "Carlsberg", 180],
    ["corona", "Corona", 230],
    ["budweiser", "Budweiser", 160],
  ]),
  ...group("cocktails", [
    ["aperol-spritz", "Aperol Spritz", 220, "Горчлив портокал, просеко и сода.", { featured: true, image: "/media/featured-aperol-spritz.webp" }],
    ["cuba-libre", "Cuba Libre", 220],
    ["margarita", "Margarita", 220],
    ["mojito", "Mojito", 220],
    ["sex-on-the-beach", "Sex on the Beach", 220],
    ["pina-colada", "Piña Colada", 240],
    ["pink-spritz", "Pink Spritz", 260],
    ["limoncello-spritz", "Limoncello Spritz", 260],
  ]),
  ...group("spirits", [
    ["liqueur", "Ликер", 180],
    ["chivas", "Chivas", 270],
    ["tequila", "Текила", 140],
    ["jagermeister", "Jägermeister", 180],
    ["jameson", "Jameson", 180],
    ["jack-daniels", "Jack Daniel's", 250],
    ["red-label", "Red Label", 180],
    ["ballantines", "Ballantine's", 160],
    ["johnnie-walker-red", "Johnnie Walker Red", 190],
    ["johnnie-walker-black", "Johnnie Walker Black", 350],
    ["martini-bianco", "Martini Bianco", 180],
    ["gin", "Џин", 140],
    ["gordons-pink", "Џин Gordon's Pink", 160],
    ["rum", "Рум", 140],
    ["vodka-cosmopolitan", "Водка Cosmopolitan", 120],
    ["vodka-smirnoff", "Водка Smirnoff", 120],
  ]),
  ...group("wine", [
    ["dalvina-red", "Далвина црвено", 330],
    ["dalvina-white", "Далвина бело", 330],
  ]),
  ...group("soft-drinks", [
    ["red-bull", "Red Bull", 200, "0,25 л"],
    ["cedevita-orange", "Cedevita Orange", 70],
    ["cedevita-lime", "Cedevita Limeta", 70],
    ["san-pellegrino-pomegranate", "San Pellegrino калинка", 120, "0,33 л"],
    ["san-pellegrino-orange", "San Pellegrino Orange", 120, "0,33 л"],
    ["orange-soda", "Orange Soda", 120],
    ["mojito-soda", "Mojito Soda", 120],
    ["lemon-soda-zero", "Lemon Soda Zero", 120],
    ["iced-tea-peach", "Леден чај праска", 120],
    ["iced-tea-lemon", "Леден чај лимон", 120],
  ]),
  ...group("aperitifs", [
    ["cognac", "Коњак", 130, "40 г"],
    ["mastika", "Мастика", 120],
    ["ouzo", "Узо", 130],
    ["stock", "Шток", 130],
    ["pelinkovac-bitter", "Пелинковац горки", 140],
    ["pelinkovac-orange", "Пелинковац оранж", 140],
    ["vinjak", "Вињак", 130],
    ["tikves-rakija", "Тиквешка ракија", 120],
    ["aperitif-rum", "Рум", 140],
  ]),
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
