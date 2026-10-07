import { z } from "zod";

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

export const LibraryGameSchema = SteamGameSchema.extend({
  hoursPlayed: z.number().int().min(0).max(100000).default(0),
  purchasedAt: z.string().datetime().optional(),
});

export const LibraryGameListSchema = z.array(LibraryGameSchema);
export type LibraryGame = z.infer<typeof LibraryGameSchema>;

const AdminLibraryGameInputSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อเกม").max(120, "ชื่อเกมยาวเกินไป"),
  image: z.string().trim().url("กรุณากรอก URL รูปภาพที่ถูกต้อง"),
  price: z.string().trim().max(60, "ราคายาวเกินไป").nullable(),
  originalPrice: z.string().trim().max(60, "ราคาปกติยาวเกินไป").nullable(),
});

export type AdminLibraryGameInput = z.infer<typeof AdminLibraryGameInputSchema>;

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
});

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

function formatSteamPrice(amountInMinorUnits: number, currency: string): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountInMinorUnits / 100);
}

function getSteamCapsuleImage(appId: number): string {
  return `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/capsule_616x353.jpg`;
}

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
    const fallbackImage = item.tiny_image || `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/capsule_231x87.jpg`;
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
      discountPercent: price && price.initial > price.final
        ? Math.round((1 - price.final / price.initial) * 100)
        : 0,
    });
  });
}

export async function getFeaturedSteamGames(): Promise<SteamGame[]> {
  const response = await fetch("https://store.steampowered.com/api/featuredcategories/?cc=th&l=thai", {
    next: { revalidate: 300 },
  });
  if (!response.ok) {
    throw new Error(`Steam featured categories API returned ${response.status}`);
  }

  const result = SteamFeaturedResponseSchema.parse(await response.json());
  const featuredItems = [
    ...result.top_sellers.items,
    ...(result.specials?.items ?? []),
    ...(result.new_releases?.items ?? []),
  ];
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

function collectionStorageKey(ownerKey: string) {
  return `game-backlog:collection:${ownerKey}`;
}

function cartStorageKey(ownerKey: string) {
  return `game-backlog:cart:${ownerKey}`;
}

export function readSteamCollection(ownerKey: string): LibraryGame[] {
  const stored = localStorage.getItem(collectionStorageKey(ownerKey));
  if (!stored) return [];

  const result = LibraryGameListSchema.safeParse(JSON.parse(stored));
  if (!result.success) {
    throw new Error("ข้อมูลคอลเลคชั่นในเบราว์เซอร์ไม่ถูกต้อง");
  }

  const normalizedGames = result.data.map((game) => {
    const image = getSteamCapsuleImage(game.id);
    return game.image === image
      ? game
      : { ...game, image, fallbackImage: game.fallbackImage ?? game.image };
  });
  const purchasedGames = normalizedGames.filter((game) => game.purchasedAt);
  const previouslySavedGames = normalizedGames.filter((game) => !game.purchasedAt);
  if (previouslySavedGames.length > 0) {
    const cart = readSteamCart(ownerKey);
    const knownIds = new Set([...purchasedGames, ...cart].map((game) => game.id));
    const migratedCart = [
      ...cart,
      ...previouslySavedGames.filter((game) => !knownIds.has(game.id)),
    ];
    localStorage.setItem(cartStorageKey(ownerKey), JSON.stringify(migratedCart));
    localStorage.setItem(collectionStorageKey(ownerKey), JSON.stringify(purchasedGames));
  } else if (normalizedGames.some((game, index) => game.image !== result.data[index].image)) {
    localStorage.setItem(collectionStorageKey(ownerKey), JSON.stringify(purchasedGames));
  }
  return purchasedGames;
}

export function readSteamCart(ownerKey: string): SteamGame[] {
  const stored = localStorage.getItem(cartStorageKey(ownerKey));
  if (!stored) return [];

  const result = SteamGameListSchema.safeParse(JSON.parse(stored));
  if (!result.success) {
    throw new Error("ข้อมูลตะกร้าในเบราว์เซอร์ไม่ถูกต้อง");
  }
  const games = result.data.map((game) => {
    const image = getSteamCapsuleImage(game.id);
    return game.image === image
      ? game
      : { ...game, image, fallbackImage: game.fallbackImage ?? game.image };
  });
  if (games.some((game, index) => game.image !== result.data[index].image)) {
    localStorage.setItem(cartStorageKey(ownerKey), JSON.stringify(games));
  }
  return games;
}

export function addSteamGameToCart(ownerKey: string, game: SteamGame): SteamGame[] {
  const cart = readSteamCart(ownerKey);
  if (cart.some((cartGame) => cartGame.id === game.id)) return cart;
  if (readSteamCollection(ownerKey).some((libraryGame) => libraryGame.id === game.id)) return cart;

  const updatedGames = [...cart, game];
  localStorage.setItem(cartStorageKey(ownerKey), JSON.stringify(updatedGames));
  return updatedGames;
}

export function removeSteamGameFromCart(ownerKey: string, gameId: number): SteamGame[] {
  const updatedGames = readSteamCart(ownerKey).filter((game) => game.id !== gameId);
  localStorage.setItem(cartStorageKey(ownerKey), JSON.stringify(updatedGames));
  return updatedGames;
}

export function markSteamGamePurchased(ownerKey: string, gameId: number): LibraryGame[] {
  const cart = readSteamCart(ownerKey);
  const game = cart.find((cartGame) => cartGame.id === gameId);
  if (!game) throw new Error("ไม่พบเกมนี้ในตะกร้า");

  const library = readSteamCollection(ownerKey);
  if (library.some((libraryGame) => libraryGame.id === gameId)) {
    throw new Error("เกมนี้อยู่ในคลังแล้ว");
  }

  const purchasedGame = LibraryGameSchema.parse({
    ...game,
    hoursPlayed: 0,
    purchasedAt: new Date().toISOString(),
  });
  const updatedLibrary = [...library, purchasedGame];
  localStorage.setItem(collectionStorageKey(ownerKey), JSON.stringify(updatedLibrary));
  localStorage.setItem(cartStorageKey(ownerKey), JSON.stringify(cart.filter((cartGame) => cartGame.id !== gameId)));
  return updatedLibrary;
}

export function updateSteamGamePlaytime(ownerKey: string, gameId: number, hoursPlayed: number): LibraryGame[] {
  const validatedHours = z.number().int().min(0).max(100000).safeParse(hoursPlayed);
  if (!validatedHours.success) {
    throw new Error("ชั่วโมงเล่นต้องเป็นจำนวนเต็มตั้งแต่ 0 ถึง 100,000 ชั่วโมง");
  }

  const library = readSteamCollection(ownerKey);
  const gameIndex = library.findIndex((game) => game.id === gameId);
  if (gameIndex === -1) throw new Error("ไม่พบเกมนี้ในคลัง");

  const updatedLibrary = library.map((game, index) =>
    index === gameIndex ? { ...game, hoursPlayed: validatedHours.data } : game
  );
  localStorage.setItem(collectionStorageKey(ownerKey), JSON.stringify(updatedLibrary));
  return updatedLibrary;
}

export function removeSteamGameFromCollection(ownerKey: string, gameId: number): LibraryGame[] {
  const updatedGames = readSteamCollection(ownerKey).filter((game) => game.id !== gameId);
  localStorage.setItem(collectionStorageKey(ownerKey), JSON.stringify(updatedGames));
  return updatedGames;
}

export function addAdminGameToCollection(ownerKey: string, input: AdminLibraryGameInput): LibraryGame[] {
  const validatedInput = AdminLibraryGameInputSchema.parse(input);
  const library = readSteamCollection(ownerKey);
  let gameId = Date.now();
  while (library.some((game) => game.id === gameId)) gameId += 1;

  const game = LibraryGameSchema.parse({
    ...validatedInput,
    id: gameId,
    price: validatedInput.price || null,
    originalPrice: validatedInput.originalPrice || null,
    priceAmount: null,
    discountPercent: 0,
    hoursPlayed: 0,
    purchasedAt: new Date().toISOString(),
  });
  const updatedLibrary = [...library, game];
  localStorage.setItem(collectionStorageKey(ownerKey), JSON.stringify(updatedLibrary));
  return updatedLibrary;
}

export function updateAdminGameInCollection(
  ownerKey: string,
  gameId: number,
  input: AdminLibraryGameInput
): LibraryGame[] {
  const validatedInput = AdminLibraryGameInputSchema.parse(input);
  const library = readSteamCollection(ownerKey);
  if (!library.some((game) => game.id === gameId)) throw new Error("ไม่พบเกมนี้ในคลัง");

  const updatedLibrary = library.map((game) =>
    game.id === gameId
      ? LibraryGameSchema.parse({
          ...game,
          ...validatedInput,
          price: validatedInput.price || null,
          originalPrice: validatedInput.originalPrice || null,
          fallbackImage: undefined,
        })
      : game
  );
  localStorage.setItem(collectionStorageKey(ownerKey), JSON.stringify(updatedLibrary));
  return updatedLibrary;
}
