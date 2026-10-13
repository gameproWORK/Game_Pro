import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/layout/SiteHeader";
import SteamCollection from "@/components/collection/SteamCollection";
import { isAdminEmail } from "@/lib/admin";

export default async function CollectionPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const ownerKey = session.user.email ?? session.user.id ?? "account";

  return (
    <main className="app-shell">
      <SiteHeader active="collection" tagline="คลังเกมส่วนตัว" isLoggedIn userName={session.user.name} />

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
