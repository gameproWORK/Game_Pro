import { auth } from "@/auth";
import { SiteHeader } from "@/components/layout/SiteHeader";
import SteamGameSearch from "@/components/store/SteamGameSearch";

export default async function HomePage() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);
  const ownerKey = session?.user?.email ?? session?.user?.id ?? "account";

  return (
    <main className="app-shell">
      <SiteHeader active="search" isLoggedIn={isLoggedIn} userName={session?.user?.name} />

      <div className="page-container">
        <SteamGameSearch ownerKey={ownerKey} isLoggedIn={isLoggedIn} />
        <footer className="site-footer">
          <span>ราคาและข้อมูลเกมอ้างอิงจาก Steam</span>
          <span>เกมที่ซื้อแล้วและเวลาเล่นของคุณ อยู่ในคลังเดียวกัน</span>
        </footer>
      </div>
    </main>
  );
}
