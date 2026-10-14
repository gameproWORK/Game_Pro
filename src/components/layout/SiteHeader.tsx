import Link from "next/link";
import { Gamepad2, Library, Mail, Search, ShoppingCart } from "lucide-react";
import { AuthButtons } from "./AuthButtons";

type NavKey = "search" | "cart" | "collection" | "contact";

const NAV_ITEMS = [
  { key: "search", href: "/", label: "ค้นหาเกม", icon: Search, needsLogin: false },
  { key: "cart", href: "/cart", label: "ตะกร้า", icon: ShoppingCart, needsLogin: true },
  { key: "collection", href: "/collection", label: "คลังเกม", icon: Library, needsLogin: true },
  { key: "contact", href: "/contact", label: "ติดต่อ", icon: Mail, needsLogin: false },
] as const;

type SiteHeaderProps = {
  active?: NavKey;
  tagline?: string;
  isLoggedIn: boolean;
  userName?: string | null;
};

export function SiteHeader({ active, tagline = "ค้นหา · ตะกร้า · คลังเกม", isLoggedIn, userName }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Gamepad2 aria-hidden="true" className="icon icon-brand" />
          </span>
          <span className="brand-copy">
            <span className="brand-name">Game <span>Pro</span></span>
            <span className="brand-tagline">{tagline}</span>
          </span>
        </Link>

        <nav aria-label="เมนูหลัก" className="site-nav">
          {NAV_ITEMS.filter((item) => isLoggedIn || !item.needsLogin).map(({ key, href, label, icon: Icon }) =>
            key === active ? (
              <span key={key} aria-current="page" className="site-nav-item is-active">
                <Icon aria-hidden="true" className="icon" />
                {label}
              </span>
            ) : (
              <Link key={key} href={href} className="site-nav-item">
                <Icon aria-hidden="true" className="icon" />
                {label}
              </Link>
            )
          )}
          <AuthButtons isLoggedIn={isLoggedIn} userName={userName} />
        </nav>
      </div>
    </header>
  );
}
