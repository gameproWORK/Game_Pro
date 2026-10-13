"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Library, ShieldCheck, ShoppingCart, Trash2, X } from "lucide-react";
import {
  markSteamGamePurchased,
  readSteamCart,
  removeSteamGameFromCart,
  type SteamGame,
} from "@/lib/steam";

export default function SteamCart({ ownerKey }: { ownerKey: string }) {
  const [games, setGames] = useState<SteamGame[]>([]);
  const [gameToConfirm, setGameToConfirm] = useState<SteamGame | null>(null);
  const [purchasedGameName, setPurchasedGameName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setGames(readSteamCart(ownerKey));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "อ่านตะกร้าไม่สำเร็จ");
    }
  }, [ownerKey]);

  useEffect(() => {
    if (!gameToConfirm) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setGameToConfirm(null);
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [gameToConfirm]);

  const knownSubtotal = useMemo(
    () => games.reduce((sum, game) => sum + (game.priceAmount ?? 0), 0),
    [games]
  );
  const unknownPriceCount = games.filter((game) => game.priceAmount === null).length;
  const formattedSubtotal = new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(knownSubtotal);

  function removeGame(gameId: number) {
    try {
      setGames(removeSteamGameFromCart(ownerKey, gameId));
      setError("");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "นำเกมออกจากตะกร้าไม่สำเร็จ");
    }
  }

  function confirmPurchase() {
    if (!gameToConfirm) return;
    try {
      markSteamGamePurchased(ownerKey, gameToConfirm.id);
      setPurchasedGameName(gameToConfirm.name);
      setGames(readSteamCart(ownerKey));
      setGameToConfirm(null);
      setError("");
    } catch (purchaseError) {
      setError(purchaseError instanceof Error ? purchaseError.message : "ย้ายเกมเข้าคลังไม่สำเร็จ");
    }
  }

  return (
    <div className="cart-layout">
      <section aria-label="รายการในตะกร้า" className="cart-items">
        {error && <p role="alert" className="notice notice-error">{error}</p>}
        {games.length > 0 ? games.map((game) => (
          <article key={game.id} className="cart-card">
            <div className="cart-card-image-wrap">
              <img
                src={game.image}
                alt={`${game.name} ภาพปกเกม`}
                className="cart-card-image"
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
            <div className="cart-card-content">
              <div className="cart-card-info">
                <h2 className="cart-card-title">{game.name}</h2>
                <div className="game-card-price">
                  {game.originalPrice && <span className="price-original">{game.originalPrice}</span>}
                  <span className="price-current">{game.price ?? "ราคาไม่พร้อมแสดง"}</span>
                </div>
              </div>
              <div className="cart-card-actions">
                <button
                  type="button"
                  onClick={() => { setGameToConfirm(game); setPurchasedGameName(""); }}
                  className="button button-confirm-purchase"
                >
                  <Check aria-hidden="true" className="icon" />
                  ยืนยันซื้อแล้ว
                </button>
                <button
                  type="button"
                  onClick={() => removeGame(game.id)}
                  aria-label={`นำ ${game.name} ออกจากตะกร้า`}
                  className="button-icon button-remove"
                >
                  <Trash2 aria-hidden="true" className="icon" />
                </button>
              </div>
            </div>
          </article>
        )) : (
          <div className="empty-state">
            <ShoppingCart aria-hidden="true" className="icon empty-state-icon" />
            <h2 className="empty-state-title">ตะกร้ายังว่างอยู่</h2>
            <p className="empty-state-description">ค้นหาเกมที่สนใจ แล้วเพิ่มเกมลงตะกร้าได้เลย</p>
            <Link href="/" className="button button-primary empty-state-action">
              ค้นหาเกม <ArrowRight aria-hidden="true" className="icon" />
            </Link>
          </div>
        )}
      </section>

      <aside className="cart-summary">
        <div className="cart-summary-header">
          <span className="cart-summary-icon">
            <ShoppingCart aria-hidden="true" className="icon icon-large" />
          </span>
          <div>
            <h2 className="cart-summary-title">สรุปตะกร้า</h2>
            <p className="cart-summary-count">{games.length} เกม</p>
          </div>
        </div>
        <div className="cart-summary-total">
          <span>รวมราคาเกมที่มีข้อมูล</span>
          <strong>{formattedSubtotal}</strong>
        </div>
        {unknownPriceCount > 0 && (
          <p className="cart-summary-warning">
            ยังไม่มีราคาสำหรับ {unknownPriceCount} เกม ยอดรวมนี้จึงเป็นราคาโดยประมาณ
          </p>
        )}
        <p className="cart-summary-note">
          หลังซื้อเกมแล้ว ให้กดยืนยัน เกมจะย้ายเข้าคลังและเริ่มนับเวลาเล่นที่ 0 ชั่วโมง
        </p>
        <Link href="/collection" className="button button-summary-library">
          <Library aria-hidden="true" className="icon" />
          ไปคลังเกม
        </Link>
      </aside>

      {purchasedGameName && (
        <div role="status" className="purchase-toast">
          <p>
            <span className="toast-game-name">{purchasedGameName}</span> อยู่ในคลังแล้ว พร้อมบันทึกเวลาเล่น
          </p>
          <Link href="/collection" className="button button-toast">
            <Library aria-hidden="true" className="icon" />
            ดูในคลัง
          </Link>
        </div>
      )}

      {gameToConfirm && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setGameToConfirm(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-purchase-title"
            aria-describedby="confirm-purchase-description"
            className="purchase-dialog"
          >
            <div className="purchase-dialog-image-wrap">
              <img
                src={gameToConfirm.image}
                alt={`${gameToConfirm.name} ภาพปกเกม`}
                className="purchase-dialog-image"
                onError={(event) => {
                  if (gameToConfirm.fallbackImage && event.currentTarget.src !== gameToConfirm.fallbackImage) {
                    event.currentTarget.src = gameToConfirm.fallbackImage;
                  }
                }}
              />
              <button
                type="button"
                autoFocus
                onClick={() => setGameToConfirm(null)}
                aria-label="ปิดหน้าต่างยืนยัน"
                className="button-icon modal-close"
              >
                <X aria-hidden="true" className="icon" />
              </button>
            </div>
            <div className="purchase-dialog-content">
              <span className="purchase-dialog-eyebrow">
                <ShieldCheck aria-hidden="true" className="icon" />
                ยืนยันรายการ
              </span>
              <h2 id="confirm-purchase-title" className="purchase-dialog-title">
                ซื้อเกมนี้เรียบร้อยแล้ว?
              </h2>
              <p id="confirm-purchase-description" className="purchase-dialog-description">
                ยืนยันว่าได้ซื้อ <strong className="purchase-dialog-game-name">{gameToConfirm.name}</strong> แล้ว เกมจะย้ายจากตะกร้าไปยังคลังทันที
              </p>
              <div className="purchase-dialog-price">
                <span>ราคาในรายการ</span>
                <strong>{gameToConfirm.price ?? "ไม่ระบุ"}</strong>
              </div>
              <p className="purchase-dialog-disclaimer">
                การยืนยันนี้บันทึกสถานะใน Game Pro เท่านั้น ไม่ได้เรียกเก็บเงินหรือซื้อผ่าน Steam
              </p>
              <div className="purchase-dialog-actions">
                <button
                  type="button"
                  onClick={() => setGameToConfirm(null)}
                  className="button button-secondary"
                >
                  ยังไม่ซื้อ
                </button>
                <button
                  type="button"
                  onClick={confirmPurchase}
                  className="button button-confirm-final"
                >
                  <Check aria-hidden="true" className="icon" />
                  ยืนยันซื้อแล้ว · เข้าคลัง
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
