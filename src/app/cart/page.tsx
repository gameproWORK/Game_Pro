import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthButtons } from "@/components/AuthButtons";
import SteamCart from "@/components/SteamCart";
import { Gamepad2, Library, Search, ShoppingCart } from "lucide-react";

export default async function CartPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const ownerKey = session.user.email ?? session.user.id ?? "account";

  return (
    <main className="app-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="brand">
            <span className="brand-mark">
              <Gamepad2 aria-hidden="true" className="icon icon-brand" />
            </span>
            <span className="brand-copy">
              <span className="brand-name">Game <span>Pro</span></span>
              <span className="brand-tagline">ตะกร้าเกมของคุณ</span>
            </span>
          </Link>
          <nav aria-label="เมนูหลัก" className="site-nav">
            <Link href="/" className="site-nav-item">
              <Search aria-hidden="true" className="icon" />
              ค้นหาเกม
            </Link>
            <span aria-current="page" className="site-nav-item is-active">
              <ShoppingCart aria-hidden="true" className="icon" />
              ตะกร้า
            </span>
            <Link href="/collection" className="site-nav-item">
              <Library aria-hidden="true" className="icon" />
              คลังเกม
            </Link>
            <AuthButtons isLoggedIn userName={session.user.name} />
          </nav>
        </div>
      </header>

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
