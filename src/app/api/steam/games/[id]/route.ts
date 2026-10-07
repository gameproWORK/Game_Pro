import { getSteamGameDetails } from "@/lib/steam";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const appId = Number(params.id);
  if (!Number.isSafeInteger(appId) || appId <= 0) {
    return NextResponse.json({ error: "รหัสเกมไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const game = await getSteamGameDetails(appId);
    if (!game) {
      return NextResponse.json({ error: "ไม่พบข้อมูลเกมนี้บน Steam" }, { status: 404 });
    }
    return NextResponse.json({ game });
  } catch (error) {
    console.error("Steam game details request failed:", error);
    return NextResponse.json({ error: "โหลดรายละเอียดเกมจาก Steam ไม่สำเร็จ" }, { status: 502 });
  }
}
