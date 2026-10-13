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

// คำค้นหายอดนิยม แสดงเป็นปุ่มลัดใต้ช่องค้นหา
const TRENDING_TERMS = ["Elden Ring", "Stardew Valley", "Cyberpunk 2077", "Hades"];

// จุดเด่นของเว็บที่แสดงในส่วน hero
const HERO_FEATURES = [
  { icon: Tag, label: "ราคาเป็นเงินบาท" },
  { icon: ShoppingCart, label: "จัดตะกร้าก่อนซื้อ" },
  { icon: Clock, label: "บันทึกชั่วโมงเล่น" },
];

// เรียก API ของเว็บเราแล้วตรวจรูปแบบข้อมูลเกมให้เรียบร้อย
async function fetchGames(url: string, fallbackMessage: string): Promise<SteamGame[]> {
  const response = await fetch(url);
  const body: unknown = await response.json();
  // ถ้า API ตอบ error ให้ใช้ข้อความ error จาก API ถ้าไม่มีก็ใช้ข้อความสำรอง
  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
      ? body.error
      : fallbackMessage;
    throw new Error(message);
  }

  // ตรวจว่า body.games เป็นรายการเกมที่ถูกต้องตาม schema
  const parsed = SteamGameListSchema.safeParse(
    typeof body === "object" && body !== null && "games" in body ? body.games : undefined
  );
  if (!parsed.success) throw new Error("รูปแบบข้อมูลเกมจาก Steam ไม่ถูกต้อง");
  return parsed.data;
}

// หน้าร้านหลัก: ค้นหาเกม เลือกหมวดหมู่ และเพิ่มเกมลงตะกร้า
export default function SteamGameSearch({ ownerKey, isLoggedIn }: { ownerKey: string; isLoggedIn: boolean }) {
  const [query, setQuery] = useState("");
  const [games, setGames] = useState<SteamGame[]>([]);
  // id ของเกมที่อยู่ในตะกร้า/คลังแล้ว ใช้เปลี่ยนสถานะปุ่มบนการ์ดเกม
  const [cartIds, setCartIds] = useState<number[]>([]);
  const [libraryIds, setLibraryIds] = useState<number[]>([]);
  // category = null แปลว่ากำลังแสดงผลการค้นหา
  const [category, setCategory] = useState<GameCategory | null>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // ตัวนับลำดับคำขอ ใช้เช็กว่าผลลัพธ์ที่ได้กลับมาเป็นของคำขอล่าสุดหรือไม่
  const requestSequence = useRef(0);

  // ป้องกันผลลัพธ์เก่ามาทับผลลัพธ์ใหม่ เวลากดเปลี่ยนเร็ว ๆ
  async function loadGames(url: string, fallbackMessage: string) {
    // ให้เลขคำขอใหม่ ถ้ามีคำขอใหม่กว่าเข้ามา ผลลัพธ์ของคำขอนี้จะถูกทิ้ง
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

  // เปลี่ยนหมวดหมู่และโหลดเกมแนะนำของหมวดนั้น
  function selectCategory(nextCategory: GameCategory) {
    setCategory(nextCategory);
    setQuery("");
    void loadGames(`/api/steam/featured?category=${nextCategory}`, "โหลดเกมในหมวดนี้ไม่สำเร็จ");
  }

  // ค้นหาเกมจากชื่อ (ต้องยาวอย่างน้อย 2 ตัวอักษร)
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

  // ตอนเปิดหน้า: อ่านเกมในตะกร้า/คลังเพื่อแสดงสถานะปุ่ม แล้วโหลดหมวด "แนะนำ"
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

  // กดส่งฟอร์มค้นหา (กันหน้ารีโหลด แล้วค้นหาด้วยคำที่พิมพ์)
  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    searchGames(query);
  }

  // เพิ่มเกมลงตะกร้าแล้วอัปเดตปุ่มให้แสดงว่าอยู่ในตะกร้าแล้ว
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

  // ชื่อภาษาไทยของหมวดที่เลือกอยู่ ใช้แสดงเป็นหัวข้อ
  const categoryLabel = GAME_CATEGORIES.find((item) => item.id === category)?.label;

  return (
    <section className="steam-search">
      {/* ส่วน hero: หัวข้อ ช่องค้นหา คำค้นยอดนิยม และจุดเด่นของเว็บ */}
      <div className="search-hero">
        <div aria-hidden="true" className="search-hero-glow" />
        {/* ภาพตกแต่งด้านข้าง (ไม่มีผลกับการใช้งาน) */}
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

          {/* ฟอร์มค้นหาเกม */}
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
              {/* แสดง "กำลังค้นหา..." เฉพาะตอนค้นหา ไม่ใช่ตอนโหลดหมวดหมู่ */}
              {loading && category === null ? "กำลังค้นหา..." : "ค้นหาเกม"}
            </button>
          </form>

          {/* ปุ่มลัดคำค้นยอดนิยม กดแล้วค้นหาทันที */}
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

      {/* แท็บเลือกหมวดหมู่ (ขายดี, ลดราคา, มาใหม่ ฯลฯ) */}
      <CategoryTabs active={category} onChange={selectCategory} />

      {/* ข้อความแจ้ง error */}
      {error &&<p role="alert" className="notice notice-error">{error}</p>}

      {/* รายการเกม: หัวข้อเปลี่ยนตามว่าเป็นหมวดหมู่หรือผลการค้นหา */}
      {games.length > 0 && (
        <section className={`search-results${category ? " search-results-featured" : ""}`}>
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">{category ? "หมวดหมู่" : "ผลการค้นหา"}</p>
              <h3 className="section-title">{category ? `เกม${categoryLabel}` : `ผลลัพธ์สำหรับ “${query}”`}</h3>
            </div>
            <span className="result-count">{games.length} รายการ</span>
          </div>
          {/* ระหว่างโหลดรายการใหม่ ยังแสดงรายการเดิมไว้แต่ใส่ class is-loading */}
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

      {/* กำลังโหลดและยังไม่มีเกมให้แสดง */}
      {loading && games.length === 0 && (
        <div className="featured-loading" role="status" aria-live="polite">
          <span className="featured-loading-spinner" />
          <span>{category ? "กำลังโหลดเกม..." : "กำลังค้นหาเกม..."}</span>
        </div>
      )}

      {/* โหลดเสร็จแล้วแต่ไม่พบเกม */}
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
