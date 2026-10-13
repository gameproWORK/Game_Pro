import { z } from "zod";

// ข้อมูลเกมพื้นฐานที่ใช้ทั้งหน้าร้านและตะกร้า
export const SteamGameSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1),
  image: z.string().url(),
  fallbackImage: z.string().url().optional(),
  price: z.string().nullable().default(null),
  priceAmount: z.number().nonnegative().nullable().default(null),
  originalPrice: z.string().nullable().default(null),
  discountPercent: z.number().int().min(0).max(100).default(0),
});

export const SteamGameListSchema = z.array(SteamGameSchema);

export type SteamGame = z.infer<typeof SteamGameSchema>;

// เกมในคลัง = ข้อมูลเกม + ชั่วโมงเล่น + วันที่ซื้อ
export const LibraryGameSchema = SteamGameSchema.extend({
  hoursPlayed: z.number().int().min(0).max(100000).default(0),
  purchasedAt: z.string().datetime().optional(),
});

export const LibraryGameListSchema = z.array(LibraryGameSchema);
export type LibraryGame = z.infer<typeof LibraryGameSchema>;

// ข้อมูลจากฟอร์มแอดมินตอนเพิ่ม/แก้ไขเกม
export const AdminLibraryGameInputSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อเกม").max(120, "ชื่อเกมยาวเกินไป"),
  image: z.string().trim().url("กรุณากรอก URL รูปภาพที่ถูกต้อง"),
  price: z.string().trim().max(60, "ราคายาวเกินไป").nullable(),
  originalPrice: z.string().trim().max(60, "ราคาปกติยาวเกินไป").nullable(),
});

export type AdminLibraryGameInput = z.infer<typeof AdminLibraryGameInputSchema>;

// ข้อมูลที่ใช้แสดงในหน้ารายละเอียดเกม
export type SteamGameDetails = {
  game: SteamGame;
  description: string;
  developers: string[];
  publishers: string[];
  genres: string[];
  releaseDate: string | null;
  backgroundImages: string[];
  screenshots: string[];
  platforms: string[];
  website: string | null;
};

// สร้าง URL รูปปกเกมขนาด 616x353 จาก appId
export function getSteamCapsuleImage(appId: number): string {
  return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/capsule_616x353.jpg`;
}
