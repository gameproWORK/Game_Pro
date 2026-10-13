"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Clock, Flame, Gamepad2, Percent, Search, ShoppingCart, Sparkles, Tag, TrendingUp } from "lucide-react";
import {
  GAME_CATEGORIES,
  SteamGameListSchema,
  addSteamGameToCart,
  readSteamCart,
  readSteamCollection,
  type GameCategory,
  type SteamGame,
} from "@/lib/steam";
import { CategoryTabs } from "./CategoryTabs";
import { GameCard } from "./GameCard";

const TRENDING_TERMS = ["Elden Ring", "Stardew Valley", "Cyberpunk 2077", "Hades"];

const HERO_FEATURES = [
  { icon: Tag, label: "ราคาเป็นเงินบาท" },
  { icon: ShoppingCart, label: "จัดตะกร้าก่อนซื้อ" },
  { icon: Clock, label: "บันทึกชั่วโมงเล่น" },
];

// เรียก API ของเว็บเราแล้วตรวจรูปแบบข้อมูลเกมให้เรียบร้อย
async function fetchGames(url: string, fallbackMessage: string): Promise<SteamGame[]> {
  const response = await fetch(url);
  const body: unknown = await response.json();
  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
      ? body.error
      : fallbackMessage;
    throw new Error(message);
  }

  const parsed = SteamGameListSchema.safeParse(
    typeof body === "object" && body !== null && "games" in body ? body.games : undefined
  );
  if (!parsed.success) throw new Error("รูปแบบข้อมูลเกมจาก Steam ไม่ถูกต้อง");
  return parsed.data;
}

export default function SteamGameSearch({ ownerKey, isLoggedIn }: { ownerKey: string; isLoggedIn: boolean }) {
  const [query, setQuery] = useState("");
  const [games, setGames] = useState<SteamGame[]>([]);
  const [cartIds, setCartIds] = useState<number[]>([]);
  const [libraryIds, setLibraryIds] = useState<number[]>([]);
  // category = null แปลว่ากำลังแสดงผลการค้นหา
  const [category, setCategory] = useState<GameCategory | null>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);

  // ป้องกันผลลัพธ์เก่ามาทับผลลัพธ์ใหม่ เวลากดเปลี่ยนเร็ว ๆ
  async function loadGames(url: string, fallbackMessage: string) {
    const requestId = ++requestSequence.current;
    setLoading(true);
    setError("");
    try {
      const result = await fetchGames(url, fallbackMessage);
      if (requestId === requestSequence.current) setGames(result);
    } catch (loadError) {
      if (requestId !== requestSequence.current) return;
      setGames([]);
      setError(loadError instanceof Error ? loadError.message : fallbackMessage);
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }

  function selectCategory(nextCategory: GameCategory) {
    setCategory(nextCategory);
    setQuery("");
    void loadGames(`/api/steam/featured?category=${nextCategory}`, "โหลดเกมในหมวดนี้ไม่สำเร็จ");
  }

  function searchGames(searchTerm: string) {
    const trimmedTerm = searchTerm.trim();
    if (trimmedTerm.length < 2) {
      setError("กรุณากรอกคำค้นหาอย่างน้อย 2 ตัวอักษร");
      return;
    }
    setQuery(trimmedTerm);
    setCategory(null);
    void loadGames(`/api/steam/search?q=${encodeURIComponent(trimmedTerm)}`, "ค้นหาเกมไม่สำเร็จ");
  }

  useEffect(() => {
    if (isLoggedIn) {
      try {
        setLibraryIds(readSteamCollection(ownerKey).map((game) => game.id));
        setCartIds(readSteamCart(ownerKey).map((game) => game.id));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "อ่านคลังเกมไม่สำเร็จ");
      }
    }
    selectCategory("all");
  }, [ownerKey, isLoggedIn]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    searchGames(query);
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

  const categoryLabel = GAME_CATEGORIES.find((item) => item.id === category)?.label;

  return (
    <section className="steam-search">
      <div className="search-hero">
        <div aria-hidden="true" className="search-hero-glow" />
        <div aria-hidden="true" className="search-hero-art">
          <div className="hero-art-orb">
            <Gamepad2 className="hero-art-icon" />
          </div>
          <span className="hero-art-badge hero-art-badge-top">
            <Flame className="icon icon-small" /> เกมขายดี
          </span>
          <span className="hero-art-badge hero-art-badge-bottom">
            <Percent className="icon icon-small" /> ลดราคา
          </span>
        </div>
        <div className="search-hero-content">
          <p className="eyebrow-pill">
            <Sparkles aria-hidden="true" className="icon icon-small" />
            เกมใหม่ เกมฮิต และเกมลดราคา
          </p>
          <h2 className="search-hero-title">
            ค้นพบเกมโปรด<br />
            <span className="search-hero-highlight">ของคุณ</span>
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
            <button type="submit" disabled={loading} className="button button-search">
              <Search aria-hidden="true" className="icon" />
              {loading && category === null ? "กำลังค้นหา..." : "ค้นหาเกม"}
            </button>
          </form>

          <div className="search-trending">
            <span className="search-trending-label">
              <TrendingUp aria-hidden="true" className="icon icon-small" />
              กำลังฮิต:
            </span>
            {TRENDING_TERMS.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => searchGames(term)}
                disabled={loading}
                className="search-trending-chip"
              >
                {term}
              </button>
            ))}
          </div>

          <ul className="hero-features">
            {HERO_FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="hero-feature">
                <span className="hero-feature-icon">
                  <Icon aria-hidden="true" className="icon icon-small" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <CategoryTabs active={category} onChange={selectCategory} />

      {error && <p role="alert" className="notice notice-error">{error}</p>}

      {games.length > 0 && (
        <section className={`search-results${category ? " search-results-featured" : ""}`}>
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">{category ? "หมวดหมู่" : "ผลการค้นหา"}</p>
              <h3 className="section-title">{category ? `เกม${categoryLabel}` : `ผลลัพธ์สำหรับ “${query}”`}</h3>
            </div>
            <span className="result-count">{games.length} รายการ</span>
          </div>
          <div className={`game-grid${loading ? " is-loading" : ""}`}>
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isLoggedIn={isLoggedIn}
                isInCart={cartIds.includes(game.id)}
                isInLibrary={libraryIds.includes(game.id)}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </section>
      )}

      {loading && games.length === 0 && (
        <div className="featured-loading" role="status" aria-live="polite">
          <span className="featured-loading-spinner" />
          <span>{category ? "กำลังโหลดเกม..." : "กำลังค้นหาเกม..."}</span>
        </div>
      )}

      {!loading && games.length === 0 && !error && (
        <div className="search-empty-state">
          <Search aria-hidden="true" className="icon search-empty-icon" />
          <p className="search-empty-title">ไม่พบรายการเกมในขณะนี้</p>
          <p className="search-empty-description">ลองเลือกหมวดอื่น หรือค้นหาชื่อเกมจากช่องด้านบน</p>
        </div>
      )}
    </section>
  );
}
