import Link from "next/link";
import { Check, ShoppingCart } from "lucide-react";
import type { SteamGame } from "@/lib/steam";

type GameCardProps = {
  game: SteamGame;
  isLoggedIn: boolean;
  isInCart: boolean;
  isInLibrary: boolean;
  onAddToCart: (game: SteamGame) => void;
};

export function GameCard({ game, isLoggedIn, isInCart, isInLibrary, onAddToCart }: GameCardProps) {
  const isOwned = isInCart || isInLibrary;
  const buttonLabel = !isLoggedIn ? "เข้าสู่ระบบก่อน" : isInLibrary ? "มีในคลัง" : isInCart ? "อยู่ในตะกร้า" : "ใส่ตะกร้า";
  const ariaLabel = !isLoggedIn
    ? `เข้าสู่ระบบเพื่อเพิ่ม ${game.name} ลงตะกร้า`
    : isInLibrary
      ? `${game.name} อยู่ในคลังแล้ว`
      : isInCart
        ? `${game.name} อยู่ในตะกร้าแล้ว`
        : `เพิ่ม ${game.name} ลงตะกร้า`;

  return (
    <article className="game-card">
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
          {game.discountPercent > 0 && <span className="discount-badge">-{game.discountPercent}%</span>}
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
          onClick={() => onAddToCart(game)}
          disabled={!isLoggedIn || isOwned}
          aria-label={ariaLabel}
          className={`button button-add-cart${!isLoggedIn ? " button-add-cart-guest" : ""}`}
        >
          {isOwned ? <Check aria-hidden="true" className="icon" /> : <ShoppingCart aria-hidden="true" className="icon" />}
          {buttonLabel}
        </button>
      </div>
    </article>
  );
}
