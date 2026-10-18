// The homepage shows two rows of featured items: drinks and food (toasts and cakes).
export const HOME_FEATURED_LIMIT = 4;
export const FOOD_CATEGORY_SLUGS = ["toasts", "cakes"];

export function isFoodCategory(slug: string) {
  return FOOD_CATEGORY_SLUGS.includes(slug);
}

// Same order and limit as the homepage, so the admin preview matches what visitors see.
export function splitFeatured<T extends { featured?: boolean; available: boolean }>(
  items: T[],
  isFood: (item: T) => boolean,
) {
  const shown = items.filter((item) => item.featured && item.available);
  return {
    drinks: shown.filter((item) => !isFood(item)).slice(0, HOME_FEATURED_LIMIT),
    food: shown.filter(isFood).slice(0, HOME_FEATURED_LIMIT),
  };
}
