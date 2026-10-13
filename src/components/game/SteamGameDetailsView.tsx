"use client";

import { useEffect, useState, type SyntheticEvent } from "react";
import Link from "next/link";
import { Check, ExternalLink, Library, ShoppingCart } from "lucide-react";
import {
  addSteamGameToCart,
  readSteamCart,
  readSteamCollection,
  type SteamGameDetails,
} from "@/lib/steam";

export default function SteamGameDetailsView({
  details,
  ownerKey,
  isLoggedIn,
}: {
  details: SteamGameDetails;
  ownerKey: string;
  isLoggedIn: boolean;
}) {
  const [isInCart, setIsInCart] = useState(false);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [screenshotFallbacks, setScreenshotFallbacks] = useState<Record<string, number>>({});
  const { game } = details;
  const heroImages = details.backgroundImages.length > 0
    ? details.backgroundImages
    : [game.image, game.fallbackImage].filter((image): image is string => Boolean(image));

  function handleHeroImageError(event: SyntheticEvent<HTMLImageElement>) {
    const nextIndex = heroImageIndex + 1;
    if (nextIndex < heroImages.length) {
      setHeroImageIndex(nextIndex);
    } else {
      setHeroImageIndex(heroImages.length);
    }
  }

  useEffect(() => {
    if (!isLoggedIn) return;
    try {
      setIsInCart(readSteamCart(ownerKey).some((item) => item.id === game.id));
      setIsInLibrary(readSteamCollection(ownerKey).some((item) => item.id === game.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "อ่านข้อมูลเกมไม่สำเร็จ");
    }
  }, [game.id, isLoggedIn, ownerKey]);

  useEffect(() => {
    setHeroImageIndex(0);
    setScreenshotFallbacks({});
  }, [game.id]);

  function addToCart() {
    if (!isLoggedIn) return;
    try {
      const cart = addSteamGameToCart(ownerKey, game);
      const added = cart.some((item) => item.id === game.id);
      setIsInCart(added);
      setIsInLibrary(!added && readSteamCollection(ownerKey).some((item) => item.id === game.id));
      setError("");
      setNotice(added ? "เพิ่มเกมลงตะกร้าแล้ว" : "");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "เพิ่มเกมลงตะกร้าไม่สำเร็จ");
    }
  }

  return (
    <article className="game-details">
      <div className="game-details-hero">
        {heroImageIndex < heroImages.length && (
          <img
            src={heroImages[heroImageIndex]}
            alt={`${game.name} ภาพพื้นหลัง`}
            className="game-details-image"
            onError={handleHeroImageError}
          />
        )}
        <div className="game-details-image-shade" />
        {game.discountPercent > 0 && (
          <span className="discount-badge game-details-discount">ลด {game.discountPercent}%</span>
        )}
        <div className="game-details-title-block">
          <span className="game-details-kicker">ร้านเกม · ประเทศไทย</span>
          <h1 className="game-details-title">{game.name}</h1>
        </div>
      </div>

      <div className="game-details-layout">
        <div className="game-details-main">
          <section className="game-details-panel">
            <h2 className="game-details-section-title">เกี่ยวกับเกมนี้</h2>
            <p className="game-details-description">
              {details.description || "ยังไม่มีคำอธิบายสำหรับเกมนี้"}
            </p>
            {details.screenshots.length > 0 && (
              <>
                <div className="game-screenshots-heading">
                  <h3 className="game-details-section-title">ภาพจากในเกม</h3>
                  <span>{details.screenshots.length} ภาพ</span>
                </div>
                <div className="game-screenshots">
                  {details.screenshots.slice(0, 6).map((screenshot, index) => {
                    const fallbackImages = [game.image];
                    const imageIndex = screenshotFallbacks[screenshot] ?? 0;
                    const imageSrc = imageIndex === 0 ? screenshot : fallbackImages[imageIndex - 1];
                    if (!imageSrc) return null;

                    return (
                      <img
                        key={screenshot}
                        src={imageSrc}
                        alt={`${game.name} ภาพหน้าจอ ${index + 1}`}
                        className="game-screenshot"
                        loading="lazy"
                        onError={() => setScreenshotFallbacks((current) => ({
                          ...current,
                          [screenshot]: imageIndex + 1,
                        }))}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>

        <aside className="game-details-sidebar">
          <div className="game-purchase-panel">
            <div className="game-purchase-price">
              {game.originalPrice && <span className="price-original">{game.originalPrice}</span>}
              <strong>{game.price ?? "ราคาไม่พร้อมแสดง"}</strong>
            </div>
            {isInLibrary ? (
              <Link href="/collection" className="button button-add-cart game-purchase-action">
                <Library aria-hidden="true" className="icon" />
                อยู่ในคลังเกมแล้ว
              </Link>
            ) : (
              <button
                type="button"
                onClick={addToCart}
                disabled={!isLoggedIn || isInCart}
                className="button button-add-cart game-purchase-action"
              >
                {isInCart ? <Check aria-hidden="true" className="icon" /> : <ShoppingCart aria-hidden="true" className="icon" />}
                {!isLoggedIn ? "เข้าสู่ระบบเพื่อใส่ตะกร้า" : isInCart ? "อยู่ในตะกร้าแล้ว" : "เพิ่มลงตะกร้า"}
              </button>
            )}
            {isInCart && (
              <Link href="/cart" className="game-cart-link">
                ไปที่ตะกร้า
              </Link>
            )}
            {error && <p role="alert" className="notice notice-error game-details-notice">{error}</p>}
            {notice && <p role="status" className="notice notice-success game-details-notice">{notice}</p>}
            <p className="game-purchase-note">ราคาและข้อมูลอ้างอิงจากร้านค้าเกมประเทศไทย</p>
          </div>

          <dl className="game-details-meta">
            <div>
              <dt>ผู้พัฒนา</dt>
              <dd>{details.developers.join(", ") || "ไม่ระบุ"}</dd>
            </div>
            <div>
              <dt>ผู้จัดจำหน่าย</dt>
              <dd>{details.publishers.join(", ") || "ไม่ระบุ"}</dd>
            </div>
            <div>
              <dt>แนวเกม</dt>
              <dd>{details.genres.join(", ") || "ไม่ระบุ"}</dd>
            </div>
            <div>
              <dt>วันวางจำหน่าย</dt>
              <dd>{details.releaseDate || "ไม่ระบุ"}</dd>
            </div>
            <div>
              <dt>แพลตฟอร์ม</dt>
              <dd className="game-platforms">
                {details.platforms.length > 0 ? details.platforms.join(" · ") : "ไม่ระบุ"}
              </dd>
            </div>
            {details.website && (
              <div>
                <dt>เว็บไซต์</dt>
                <dd>
                  <a href={details.website} target="_blank" rel="noreferrer" className="game-website-link">
                    เว็บไซต์เกม <ExternalLink aria-hidden="true" className="icon icon-small" />
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </aside>
      </div>
      <p className="game-details-disclaimer">
        การเพิ่มลงตะกร้าเป็นการบันทึกรายการใน Game Pro เท่านั้น ไม่ได้ทำรายการชำระเงินจริงหรือซื้อผ่านร้านค้าจริง
      </p>
    </article>
  );
}
