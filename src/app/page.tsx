import Link from "next/link";
import { Gamepad2, Library, Search, ShoppingCart } from "lucide-react";
import { auth } from "@/auth";
import { AuthButtons } from "@/components/AuthButtons";
import SteamGameSearch from "@/components/SteamGameSearch";

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);
  const ownerKey = session?.user?.email ?? session?.user?.id ?? "account";

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
              <span className="brand-tagline">ค้นหา · ตะกร้า · คลังเกม</span>
            </span>
          </Link>

          <nav aria-label="เมนูหลัก" className="site-nav">
            <span aria-current="page" className="site-nav-item is-active">
              <Search aria-hidden="true" className="icon" />
              ค้นหาเกม
            </span>
            {isLoggedIn && (
              <>
                <Link href="/cart" className="site-nav-item">
                  <ShoppingCart aria-hidden="true" className="icon" />
                  ตะกร้า
                </Link>
                <Link href="/collection" className="site-nav-item">
                  <Library aria-hidden="true" className="icon" />
                  คลังเกม
                </Link>
              </>
            )}
            <AuthButtons isLoggedIn={isLoggedIn} userName={session?.user?.name} />
          </nav>
        </div>
      </header>

      <div className="page-container">
        <SteamGameSearch ownerKey={ownerKey} isLoggedIn={isLoggedIn} />
        <footer className="site-footer">
          <span>ราคาและข้อมูลเกมอ้างอิงจากร้านค้าเกมประเทศไทย</span>
          <span>เกมที่ซื้อแล้วและเวลาเล่นของคุณ อยู่ในคลังเดียวกัน</span>
        </footer>
      </div>
    </main>
  );
}
