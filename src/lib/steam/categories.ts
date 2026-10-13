// หมวดหมู่เกมในหน้าร้าน (id ตรงกับชื่อหมวดใน Steam featuredcategories API)
export const GAME_CATEGORIES = [
  { id: "all", label: "แนะนำ" },
  { id: "top_sellers", label: "ขายดี" },
  { id: "specials", label: "ลดราคา" },
  { id: "new_releases", label: "มาใหม่" },
  { id: "coming_soon", label: "เร็ว ๆ นี้" },
] as const;

export type GameCategory = (typeof GAME_CATEGORIES)[number]["id"];

// ตรวจว่าค่าที่รับมาเป็นหมวดหมู่ที่รองรับหรือไม่
export function isGameCategory(value: string): value is GameCategory {
  return GAME_CATEGORIES.some((category) => category.id === value);
}
