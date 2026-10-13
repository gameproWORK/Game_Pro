import { z } from "zod";
import {
  AdminLibraryGameInputSchema,
  LibraryGameListSchema,
  LibraryGameSchema,
  SteamGameListSchema,
  getSteamCapsuleImage,
  type AdminLibraryGameInput,
  type LibraryGame,
  type SteamGame,
} from "./schemas";

// คลังเกมและตะกร้าเก็บใน localStorage แยก key ตามผู้ใช้ (ownerKey)
function collectionStorageKey(ownerKey: string) {
  return `game-backlog:collection:${ownerKey}`;
}

function cartStorageKey(ownerKey: string) {
  return `game-backlog:cart:${ownerKey}`;
}

// อ่านคลังเกมที่ซื้อแล้ว พร้อมปรับข้อมูลรูปแบบเก่าให้เป็นรูปแบบปัจจุบัน
export function readSteamCollection(ownerKey: string): LibraryGame[] {
  const stored = localStorage.getItem(collectionStorageKey(ownerKey));
  if (!stored) return [];

  const result = LibraryGameListSchema.safeParse(JSON.parse(stored));
  if (!result.success) {
    throw new Error("ข้อมูลคอลเลคชั่นในเบราว์เซอร์ไม่ถูกต้อง");
  }

  // เปลี่ยนรูปปกเป็นขนาดมาตรฐาน และเก็บรูปเดิมไว้เป็นรูปสำรอง
  const normalizedGames = result.data.map((game) => {
    const image = getSteamCapsuleImage(game.id);
    return game.image === image
      ? game
      : { ...game, image, fallbackImage: game.fallbackImage ?? game.image };
  });
  const purchasedGames = normalizedGames.filter((game) => game.purchasedAt);
  const previouslySavedGames = normalizedGames.filter((game) => !game.purchasedAt);
  // ข้อมูลเวอร์ชันเก่าที่ยังไม่ได้ซื้อ (ไม่มี purchasedAt) ให้ย้ายไปไว้ในตะกร้าแทน
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

// อ่านเกมในตะกร้า (และปรับรูปปกแบบเดียวกับคลังเกม)
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

// เพิ่มเกมลงตะกร้า ข้ามถ้ามีในตะกร้าอยู่แล้วหรือซื้อไปแล้ว
export function addSteamGameToCart(ownerKey: string, game: SteamGame): SteamGame[] {
  const cart = readSteamCart(ownerKey);
  if (cart.some((cartGame) => cartGame.id === game.id)) return cart;
  if (readSteamCollection(ownerKey).some((libraryGame) => libraryGame.id === game.id)) return cart;

  const updatedGames = [...cart, game];
  localStorage.setItem(cartStorageKey(ownerKey), JSON.stringify(updatedGames));
  return updatedGames;
}

// ลบเกมออกจากตะกร้า
export function removeSteamGameFromCart(ownerKey: string, gameId: number): SteamGame[] {
  const updatedGames = readSteamCart(ownerKey).filter((game) => game.id !== gameId);
  localStorage.setItem(cartStorageKey(ownerKey), JSON.stringify(updatedGames));
  return updatedGames;
}

// "ซื้อ" เกม: ย้ายเกมจากตะกร้าไปไว้ในคลัง พร้อมบันทึกเวลาที่ซื้อ
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

// แก้ไขชั่วโมงเล่นของเกมในคลัง (จำนวนเต็ม 0–100,000)
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

// ลบเกมออกจากคลัง
export function removeSteamGameFromCollection(ownerKey: string, gameId: number): LibraryGame[] {
  const updatedGames = readSteamCollection(ownerKey).filter((game) => game.id !== gameId);
  localStorage.setItem(collectionStorageKey(ownerKey), JSON.stringify(updatedGames));
  return updatedGames;
}

// (แอดมิน) เพิ่มเกมที่ไม่ได้มาจาก Steam เข้าคลังด้วยตัวเอง
export function addAdminGameToCollection(ownerKey: string, input: AdminLibraryGameInput): LibraryGame[] {
  const validatedInput = AdminLibraryGameInputSchema.parse(input);
  const library = readSteamCollection(ownerKey);
  // ใช้เวลาปัจจุบันเป็น id และขยับไปเรื่อย ๆ ถ้าชนกับ id ที่มีอยู่
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

// (แอดมิน) แก้ไขชื่อ รูป และราคาของเกมในคลัง
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
