import { getFeaturedSteamGames, isGameCategory } from "@/lib/steam";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category") ?? "all";
  if (!isGameCategory(category)) {
    return NextResponse.json({ error: "ไม่พบหมวดหมู่นี้" }, { status: 400 });
  }

  try {
    const games = await getFeaturedSteamGames(category);
    return NextResponse.json({ games });
  } catch (error) {
    console.error("Steam featured games request failed:", error);
    return NextResponse.json({ error: "โหลดเกมแนะนำจาก Steam ไม่สำเร็จ กรุณาลองค้นหาเกม" }, { status: 502 });
  }
}
