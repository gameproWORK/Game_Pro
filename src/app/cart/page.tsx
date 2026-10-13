import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/layout/SiteHeader";
import SteamCart from "@/components/cart/SteamCart";

export default async function CartPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const ownerKey = session.user.email ?? session.user.id ?? "account";

  return (
    <main className="app-shell">
      <SiteHeader active="cart" tagline="ตะกร้าเกมของคุณ" isLoggedIn userName={session.user.name} />

      <div className="page-container">
        <div className="page-heading">
          <p className="page-eyebrow">ร้านเกม · ราคาไทย</p>
          <h1 className="page-title">ตะกร้าของฉัน</h1>
          <p className="page-description">รวมเกมที่สนใจก่อนย้ายเกมที่ซื้อแล้วไปเก็บในคลัง</p>
        </div>
        <SteamCart ownerKey={ownerKey} />
        <p className="page-footnote">
          ตะกร้านี้ใช้จัดรายการเกมภายในเว็บ ไม่ได้ทำรายการชำระเงินจริงหรือเชื่อมต่อบัญชีร้านค้า
        </p>
      </div>
    </main>
  );
}
