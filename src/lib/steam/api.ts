import { z } from "zod";
import { SteamGameSchema, getSteamCapsuleImage, type SteamGame, type SteamGameDetails } from "./schemas";
import type { GameCategory } from "./categories";

// โครงสร้างข้อมูลที่ได้จาก Steam storesearch API (ใช้ตอนค้นหาเกม)
const SteamSearchResponseSchema = z.object({
  items: z.array(z.object({
    id: z.coerce.number().int().positive(),
    name: z.string().trim().min(1),
    tiny_image: z.string().url().optional(),
    price: z.object({
      currency: z.string().length(3),
      final: z.number().int().nonnegative(),
      initial: z.number().int().nonnegative(),
    }).nullable().optional(),
  })),
});

// โครงสร้างข้อมูลจาก Steam featuredcategories API (เกมแนะนำแยกตามหมวด)
const SteamFeaturedItemSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  currency: z.string().length(3).nullable().optional(),
  final_price: z.number().int().nonnegative().nullable().optional(),
  original_price: z.number().int().nonnegative().nullable().optional(),
  discount_percent: z.number().int().min(0).max(100).nullable().optional(),
  header_image: z.string().url().nullable().optional(),
  large_capsule_image: z.string().url().nullable().optional(),
});

const SteamFeaturedCategorySchema = z.object({
  items: z.array(SteamFeaturedItemSchema),
});

const SteamFeaturedResponseSchema = z.object({
  top_sellers: SteamFeaturedCategorySchema,
  specials: SteamFeaturedCategorySchema.optional(),
  new_releases: SteamFeaturedCategorySchema.optional(),
  coming_soon: SteamFeaturedCategorySchema.optional(),
});

// โครงสร้างข้อมูลจาก Steam appdetails API (รายละเอียดเกม 1 เกม)
const SteamAppDetailsSchema = z.object({
  success: z.boolean(),
  data: z.object({
    name: z.string().trim().min(1),
    steam_appid: z.number().int().positive(),
    short_description: z.string().optional().default(""),
    about_the_game: z.string().optional().default(""),
    background: z.string().url().nullable().optional(),
    background_raw: z.string().url().nullable().optional(),
    header_image: z.string().url().nullable().optional(),
    capsule_image: z.string().url().nullable().optional(),
    website: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
    developers: z.array(z.string()).optional().default([]),
    publishers: z.array(z.string()).optional().default([]),
    genres: z.array(z.object({ description: z.string() })).optional().default([]),
    release_date: z.object({
      coming_soon: z.boolean().optional(),
      date: z.string().optional(),
    }).optional(),
    screenshots: z.array(z.object({
      path_full: z.string().url(),
    })).optional().default([]),
    platforms: z.object({
      windows: z.boolean().optional(),
      mac: z.boolean().optional(),
      linux: z.boolean().optional(),
    }).optional(),
    is_free: z.boolean().optional().default(false),
    price_overview: z.object({
      currency: z.string().length(3),
      initial: z.number().int().nonnegative(),
      final: z.number().int().nonnegative(),
      discount_percent: z.number().int().min(0).max(100),
      initial_formatted: z.string().optional().default(""),
      final_formatted: z.string().optional().default(""),
    }).nullable().optional(),
  }),
});

// Steam ส่งราคาเป็นหน่วยย่อย (สตางค์) จึงหาร 100 แล้วจัดรูปแบบเป็นสกุลเงิน
function formatSteamPrice(amountInMinorUnits: number, currency: string): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountInMinorUnits / 100);
}


// แปลงคำอธิบายเกมที่เป็น HTML ให้เป็นข้อความธรรมดา
function stripSteamMarkup(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ดึงรายละเอียดเกมตาม appId (แคช 5 นาที) คืน null ถ้าไม่พบเกมหรือข้อมูลไม่ถูกต้อง
export async function getSteamGameDetails(appId: number): Promise<SteamGameDetails | null> {
  const url = new URL("https://store.steampowered.com/api/appdetails");
  url.searchParams.set("appids", String(appId));
  url.searchParams.set("cc", "th");
  url.searchParams.set("l", "thai");

  const response = await fetch(url, { next: { revalidate: 300 } });
  if (!response.ok) {
    throw new Error(`Steam app details API returned ${response.status}`);
  }

  const result: unknown = await response.json();
  // Steam คืนข้อมูลในรูป { [appId]: { success, data } }
  const entry = typeof result === "object" && result !== null
    ? (result as Record<string, unknown>)[String(appId)]
    : undefined;
  const parsed = SteamAppDetailsSchema.safeParse(entry);
  if (!parsed.success || !parsed.data.success || parsed.data.data.steam_appid !== appId) return null;

  const details = parsed.data.data;
  const price = details.price_overview;
  const isFree = details.is_free || price?.final === 0;
  const fallbackImage = details.capsule_image
    || `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;
  const game = SteamGameSchema.parse({
    id: appId,
    name: details.name,
    image: details.header_image || fallbackImage,
    fallbackImage,
    price: isFree
      ? "ฟรี"
      : price
        ? price.final_formatted || formatSteamPrice(price.final, price.currency)
        : null,
    priceAmount: price ? price.final / 100 : null,
    originalPrice: price && !isFree && price.initial > price.final
      ? price.initial_formatted || formatSteamPrice(price.initial, price.currency)
      : null,
    discountPercent: price?.discount_percent ?? 0,
  });
  const platformData = details.platforms;
  const platforms = [
    platformData?.windows ? "Windows" : null,
    platformData?.mac ? "macOS" : null,
    platformData?.linux ? "Linux" : null,
  ].filter((platform): platform is string => platform !== null);

  return {
    game,
    description: stripSteamMarkup(details.short_description || details.about_the_game),
    developers: details.developers,
    publishers: details.publishers,
    genres: details.genres.map((genre) => genre.description),
    releaseDate: details.release_date?.coming_soon
      ? "เร็ว ๆ นี้"
      : details.release_date?.date || null,
    // รวมรูปที่ใช้เป็นพื้นหลังได้ เรียงตามลำดับที่อยากใช้ก่อน และตัดรูปซ้ำ
    backgroundImages: Array.from(new Set([
      details.background_raw,
      ...details.screenshots.map((screenshot) => screenshot.path_full),
      details.background,
      details.header_image,
      details.capsule_image,
      game.image,
      `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
    ].filter((image): image is string => Boolean(image)))),
    screenshots: details.screenshots.map((screenshot) => screenshot.path_full),
    platforms,
    website: details.website || null,
  };
}

// ค้นหาเกมจากชื่อ (ไม่แคช) คืนผลลัพธ์สูงสุด 12 เกม
export async function searchSteamGames(query: string): Promise<SteamGame[]> {
  const url = new URL("https://store.steampowered.com/api/storesearch/");
  url.searchParams.set("term", query);
  url.searchParams.set("l", "thai");
  url.searchParams.set("cc", "th");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Steam Store API returned ${response.status}`);
  }

  const result = SteamSearchResponseSchema.parse(await response.json());
  return result.items.slice(0, 12).map((item) => {
    const price = item.price ?? null;
    const isFree = price?.final === 0;
    // ใช้ header.jpg (460x215) เป็นรูปสำรอง แทน tiny_image (231x87) ที่ขยายแล้วภาพแตก
    const fallbackImage = `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/header.jpg`;
    return SteamGameSchema.parse({
      id: item.id,
      name: item.name,
      image: getSteamCapsuleImage(item.id),
      fallbackImage,
      price: isFree ? "ฟรี" : price ? formatSteamPrice(price.final, price.currency) : null,
      priceAmount: price ? price.final / 100 : null,
      originalPrice: price && !isFree && price.initial > price.final
        ? formatSteamPrice(price.initial, price.currency)
        : null,
      // API ค้นหาไม่ส่ง % ส่วนลดมา จึงคำนวณเองจากราคาเดิมกับราคาปัจจุบัน
      discountPercent: price && price.initial > price.final
        ? Math.round((1 - price.final / price.initial) * 100)
        : 0,
    });
  });
}

// ดึงเกมแนะนำตามหมวดหมู่ (แคช 5 นาที) คืนสูงสุด 18 เกม
export async function getFeaturedSteamGames(category: GameCategory = "all"): Promise<SteamGame[]> {
  const response = await fetch("https://store.steampowered.com/api/featuredcategories/?cc=th&l=thai", {
    next: { revalidate: 300 },
  });
  if (!response.ok) {
    throw new Error(`Steam featured categories API returned ${response.status}`);
  }

  const result = SteamFeaturedResponseSchema.parse(await response.json());
  // หมวด "all" รวมขายดี + ลดราคา + มาใหม่ เข้าด้วยกัน
  const featuredItems = category === "all"
    ? [
        ...result.top_sellers.items,
        ...(result.specials?.items ?? []),
        ...(result.new_releases?.items ?? []),
      ]
    : result[category]?.items ?? [];
  // ตัดเกมที่ซ้ำกันออกโดยใช้ id
  const uniqueItems = Array.from(new Map(featuredItems.map((item) => [item.id, item])).values());

  return uniqueItems.slice(0, 18).map((item) => {
    const currency = item.currency ?? "THB";
    const finalPrice = item.final_price;
    const originalPrice = item.original_price;
    const isFree = finalPrice === 0;
    const hasPrice = typeof finalPrice === "number";
    return SteamGameSchema.parse({
      id: item.id,
      name: item.name,
      image: item.large_capsule_image || getSteamCapsuleImage(item.id),
      fallbackImage: item.header_image,
      price: isFree ? "ฟรี" : hasPrice ? formatSteamPrice(finalPrice, currency) : null,
      priceAmount: hasPrice ? finalPrice / 100 : null,
      originalPrice: !isFree && typeof originalPrice === "number" && hasPrice && originalPrice > finalPrice
        ? formatSteamPrice(originalPrice, currency)
        : null,
      discountPercent: item.discount_percent ?? 0,
    });
  });
}
