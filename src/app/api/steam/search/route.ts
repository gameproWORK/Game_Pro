import { searchSteamGames } from "@/lib/steam";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 80) {
    return NextResponse.json({ error: "กรุณากรอกคำค้นหาความยาว 2–80 ตัวอักษร" }, { status: 400 });
  }

  try {
    const games = await searchSteamGames(query);
    return NextResponse.json({ games });
  } catch (error) {
    console.error("Steam game search failed:", error);
    return NextResponse.json({ error: "ค้นหาเกมจาก Steam ไม่สำเร็จ กรุณาลองอีกครั้ง" }, { status: 502 });
  }
}
