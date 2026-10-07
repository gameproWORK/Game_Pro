import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthButtons } from "@/components/AuthButtons";
import SteamCollection from "@/components/SteamCollection";
import { Gamepad2, Library, Search, ShoppingCart } from "lucide-react";
import { isAdminEmail } from "@/lib/admin";

export default async function CollectionPage() {
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
              <span className="brand-tagline">คลังเกมส่วนตัว</span>
            </span>
          </Link>
          <nav aria-label="เมนูหลัก" className="site-nav">
            <Link href="/" className="site-nav-item">
              <Search aria-hidden="true" className="icon" />
              ค้นหาเกม
            </Link>
            <Link href="/cart" className="site-nav-item">
              <ShoppingCart aria-hidden="true" className="icon" />
              ตะกร้า
            </Link>
            <span aria-current="page" className="site-nav-item is-active">
              <Library aria-hidden="true" className="icon" />
              คลังเกม
            </span>
            <AuthButtons isLoggedIn userName={session.user.name} />
          </nav>
        </div>
      </header>

      <div className="page-container">
        <div className="page-heading">
          <p className="page-eyebrow">ห้องสมุดเกมของคุณ</p>
          <h1 className="page-title">คลังเกมของฉัน</h1>
          <p className="page-description">รวมเกมที่ซื้อแล้ว พร้อมบันทึกจำนวนชั่วโมงที่คุณเล่นไป</p>
        </div>
        <SteamCollection ownerKey={ownerKey} isAdmin={isAdminEmail(session.user.email)} />
      </div>
    </main>
  );
}
