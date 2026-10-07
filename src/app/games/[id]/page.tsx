import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Gamepad2, Library, Search, ShoppingCart } from "lucide-react";
import { auth } from "@/auth";
import { AuthButtons } from "@/components/AuthButtons";
import SteamGameDetailsView from "@/components/SteamGameDetailsView";
import { getSteamGameDetails } from "@/lib/steam";

export default async function GameDetailsPage({ params }: { params: { id: string } }) {
  const appId = Number(params.id);
  if (!Number.isSafeInteger(appId) || appId <= 0) notFound();

  const details = await getSteamGameDetails(appId);
  if (!details) notFound();

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
            <Link href="/" className="site-nav-item">
              <Search aria-hidden="true" className="icon" />
              ค้นหาเกม
            </Link>
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

      <div className="page-container game-details-page">
        <Link href="/" className="game-details-back">
          <ArrowLeft aria-hidden="true" className="icon" />
          กลับไปเลือกดูเกม
        </Link>
        <SteamGameDetailsView details={details} ownerKey={ownerKey} isLoggedIn={isLoggedIn} />
      </div>
    </main>
  );
}
