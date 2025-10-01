// Product categories - используется в фильтрах админ-панели и каталога
export const PRODUCT_CATEGORIES = {
  JACKETS: "куртки",
  PANTS: "брюки",
  HOODIES: "худи",
  SPORT_SUITS: "спортивные_костюмы",
  SHOES: "обувь",
  ACCESSORIES: "аксессуары",
} as const;

// Нормализация категории для сравнения
export function normalizeCategory(category: string | null | undefined): string {
  if (!category) return "";
  return category.toLowerCase().trim().replace(/\s+/g, "_");
}

// Проверка соответствия категории фильтру
export function matchesCategory(productCategory: string | null | undefined, filter: string): boolean {
  if (filter === "all") return true;
  return normalizeCategory(productCategory) === normalizeCategory(filter);
}

// Sport types для боксов
export const SPORT_TYPES = [
  "Единоборства 🥊",
  "Бег/кардио",
  "Силовые тренировки", 
  "Йога",
  "Командные виды спорта",
  "Повседневная носка"
] as const;

// Box categories
export const BOX_CATEGORIES = {
  PERSONAL: "personal",
  GIFT: "gift",
  SEASONAL: "seasonal",
} as const;
