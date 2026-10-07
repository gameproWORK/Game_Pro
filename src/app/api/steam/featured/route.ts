import { getFeaturedSteamGames } from "@/lib/steam";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const games = await getFeaturedSteamGames();
    return NextResponse.json({ games });
  } catch (error) {
    console.error("Steam featured games request failed:", error);
    return NextResponse.json({ error: "โหลดเกมแนะนำจาก Steam ไม่สำเร็จ กรุณาลองค้นหาเกม" }, { status: 502 });
  }
}
