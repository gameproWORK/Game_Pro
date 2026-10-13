import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/layout/SiteHeader";
import SteamGameDetailsView from "@/components/game/SteamGameDetailsView";
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
      <SiteHeader isLoggedIn={isLoggedIn} userName={session?.user?.name} />

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
