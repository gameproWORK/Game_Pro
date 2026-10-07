"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { SteamGameListSchema, addSteamGameToCart, readSteamCart, readSteamCollection, type SteamGame } from "@/lib/steam";
import { Check, Search, ShoppingCart, Sparkles } from "lucide-react";

export default function SteamGameSearch({ ownerKey, isLoggedIn }: { ownerKey: string; isLoggedIn: boolean }) {
  const [query, setQuery] = useState("");
  const [games, setGames] = useState<SteamGame[]>([]);
  const [cartIds, setCartIds] = useState<number[]>([]);
  const [libraryIds, setLibraryIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [showingFeatured, setShowingFeatured] = useState(true);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);

  useEffect(() => {
    if (isLoggedIn) {
      try {
        setLibraryIds(readSteamCollection(ownerKey).map((game) => game.id));
        setCartIds(readSteamCart(ownerKey).map((game) => game.id));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "อ่านคลังเกมไม่สำเร็จ");
      }
    }

    const controller = new AbortController();
    const requestId = ++requestSequence.current;
    async function loadFeaturedGames() {
      try {
        const response = await fetch("/api/steam/featured", { signal: controller.signal });
        const body: unknown = await response.json();
        if (!response.ok) {
          const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
            ? body.error
            : "โหลดเกมแนะนำไม่สำเร็จ";
          throw new Error(message);
        }

        const parsed = SteamGameListSchema.safeParse(
          typeof body === "object" && body !== null && "games" in body ? body.games : undefined
        );
        if (!parsed.success) throw new Error("รูปแบบข้อมูลเกมแนะนำจาก Steam ไม่ถูกต้อง");
        if (requestId !== requestSequence.current) return;
        setGames(parsed.data);
        setShowingFeatured(true);
        setError("");
      } catch (featuredError) {
        if (controller.signal.aborted || requestId !== requestSequence.current) return;
        setGames([]);
        setError(featuredError instanceof Error ? featuredError.message : "โหลดเกมแนะนำไม่สำเร็จ");
      } finally {
        if (!controller.signal.aborted && requestId === requestSequence.current) setFeaturedLoading(false);
      }
    }

    void loadFeaturedGames();
    return () => controller.abort();
  }, [ownerKey, isLoggedIn]);

  async function searchGames(searchTerm: string) {
    const trimmedTerm = searchTerm.trim();
    if (trimmedTerm.length < 2) {
      setError("กรุณากรอกคำค้นหาอย่างน้อย 2 ตัวอักษร");
      return;
    }

    setLoading(true);
    setFeaturedLoading(false);
    setError("");
    setShowingFeatured(false);
    const requestId = ++requestSequence.current;
    try {
      setQuery(trimmedTerm);
      const response = await fetch(`/api/steam/search?q=${encodeURIComponent(trimmedTerm)}`);
      const body: unknown = await response.json();
      if (!response.ok) {
        const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
          ? body.error
          : "ค้นหาเกมไม่สำเร็จ";
        throw new Error(message);
      }

      const parsed = SteamGameListSchema.safeParse(
        typeof body === "object" && body !== null && "games" in body ? body.games : undefined
      );
      if (!parsed.success) throw new Error("รูปแบบข้อมูลเกมจาก Steam ไม่ถูกต้อง");
      if (requestId !== requestSequence.current) return;
      setGames(parsed.data);
      setShowingFeatured(false);
    } catch (searchError) {
      if (requestId !== requestSequence.current) return;
      setGames([]);
      setError(searchError instanceof Error ? searchError.message : "ค้นหาเกมไม่สำเร็จ");
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await searchGames(query);
  }

  function addToCart(game: SteamGame) {
    if (!isLoggedIn) return;
    try {
      const cart = addSteamGameToCart(ownerKey, game);
      setCartIds(cart.map((cartGame) => cartGame.id));
      setError("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "เพิ่มเกมลงตะกร้าไม่สำเร็จ");
    }
  }

  return (
    <section className="steam-search">
      <div className="search-hero">
        <div aria-hidden="true" className="search-hero-glow" />
        <div aria-hidden="true" className="search-hero-ring search-hero-ring-large" />
        <div aria-hidden="true" className="search-hero-ring search-hero-ring-small" />
        <div className="search-hero-content">
          <p className="eyebrow-pill">
            <Sparkles aria-hidden="true" className="icon icon-small" />
            เกมใหม่ เกมฮิต และเกมลดราคา
          </p>
          <h2 className="search-hero-title">
            ค้นพบเกมโปรด<br className="mobile-only-break" /> ของคุณ
          </h2>
          <p className="search-hero-description">
            เลือกดูเกม ค้นหาราคาและส่วนลด แล้วเพิ่มเกมที่สนใจลงตะกร้า
          </p>

          <form onSubmit={handleSearch} className="search-form">
            <label className="search-field">
              <span className="sr-only">ค้นหาเกมในร้านเกม</span>
              <Search aria-hidden="true" className="icon search-field-icon" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ค้นหาชื่อเกมที่อยากเล่น..."
                maxLength={80}
                className="search-input"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="button button-search"
            >
              <Search aria-hidden="true" className="icon" />
              {loading ? "กำลังค้นหา..." : "ค้นหาเกม"}
            </button>
          </form>

          <div className="search-trending">
            <span className="search-trending-label">กำลังฮิต:</span>
            {["Elden Ring", "Stardew Valley", "Cyberpunk 2077", "Hades"].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => void searchGames(term)}
                disabled={loading}
                className="search-trending-chip"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p role="alert" className="notice notice-error">{error}</p>}

      {games.length > 0 && (
        <section className={`search-results${showingFeatured ? " search-results-featured" : ""}`}>
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">{showingFeatured ? "กำลังมาแรง" : "ผลการค้นหา"}</p>
              <h3 className="section-title">{showingFeatured ? "เกมแนะนำ" : `ผลลัพธ์สำหรับ “${query}”`}</h3>
            </div>
            <span className="result-count">{games.length} รายการ</span>
          </div>
          <div className="game-grid">
            {games.map((game) => {
              const isInCart = cartIds.includes(game.id);
              const isInLibrary = libraryIds.includes(game.id);
              return (
                <article key={game.id} className="game-card">
                  <Link href={`/games/${game.id}`} className="game-card-details-link" aria-label={`ดูรายละเอียด ${game.name}`}>
                    <div className="game-card-image-wrap">
                      <img
                        src={game.image}
                        alt={`${game.name} ภาพปกเกม`}
                        className="game-card-image"
                        onError={(event) => {
                          if (game.fallbackImage && event.currentTarget.src !== game.fallbackImage) {
                            event.currentTarget.src = game.fallbackImage;
                          }
                        }}
                      />
                      {game.discountPercent > 0 && (
                        <span className="discount-badge">
                          -{game.discountPercent}%
                        </span>
                      )}
                    </div>
                    <div className="game-card-title-wrap">
                      <h4 className="game-card-title">{game.name}</h4>
                    </div>
                  </Link>
                  <div className="game-card-footer">
                    <div className="game-card-price">
                      {game.originalPrice && <span className="price-original">{game.originalPrice}</span>}
                      <span className="price-current">{game.price ?? "ราคาไม่พร้อมแสดง"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(game)}
                      disabled={!isLoggedIn || isInCart || isInLibrary}
                      aria-label={!isLoggedIn ? `เข้าสู่ระบบเพื่อเพิ่ม ${game.name} ลงตะกร้า` : isInLibrary ? `${game.name} อยู่ในคลังแล้ว` : isInCart ? `${game.name} อยู่ในตะกร้าแล้ว` : `เพิ่ม ${game.name} ลงตะกร้า`}
                      className={`button button-add-cart${!isLoggedIn ? " button-add-cart-guest" : ""}`}
                    >
                      {isInCart || isInLibrary ? <Check aria-hidden="true" className="icon" /> : <ShoppingCart aria-hidden="true" className="icon" />}
                      {!isLoggedIn ? "เข้าสู่ระบบก่อน" : isInLibrary ? "มีในคลัง" : isInCart ? "อยู่ในตะกร้า" : "ใส่ตะกร้า"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {(featuredLoading || loading) && games.length === 0 && (
        <div className="featured-loading" role="status" aria-live="polite">
          <span className="featured-loading-spinner" />
          <span>{featuredLoading ? "กำลังโหลดเกมแนะนำ..." : "กำลังค้นหาเกม..."}</span>
        </div>
      )}

      {!featuredLoading && !loading && games.length === 0 && !error && (
        <div className="search-empty-state">
          <Search aria-hidden="true" className="icon search-empty-icon" />
          <p className="search-empty-title">ไม่พบรายการเกมในขณะนี้</p>
          <p className="search-empty-description">ลองค้นหาชื่อเกมที่ต้องการได้จากช่องด้านบน</p>
        </div>
      )}
    </section>
  );
}
