"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Gamepad2, Library, Pencil, Plus, Save, ShoppingCart, Trash2, X } from "lucide-react";
import {
  addAdminGameToCollection,
  readSteamCollection,
  removeSteamGameFromCollection,
  updateAdminGameInCollection,
  updateSteamGamePlaytime,
  type AdminLibraryGameInput,
  type LibraryGame,
} from "@/lib/steam";

const EMPTY_ADMIN_GAME: AdminLibraryGameInput = {
  name: "",
  image: "",
  price: null,
  originalPrice: null,
};

export default function SteamCollection({ ownerKey, isAdmin }: { ownerKey: string; isAdmin: boolean }) {
  const [games, setGames] = useState<LibraryGame[]>([]);
  const [playtimeDrafts, setPlaytimeDrafts] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [gameToRemove, setGameToRemove] = useState<LibraryGame | null>(null);
  const [gameToEdit, setGameToEdit] = useState<LibraryGame | null>(null);
  const [adminFormOpen, setAdminFormOpen] = useState(false);
  const [adminGameDraft, setAdminGameDraft] = useState<AdminLibraryGameInput>(EMPTY_ADMIN_GAME);
  const totalHoursPlayed = games.reduce((total, game) => total + game.hoursPlayed, 0);
  const formattedTotalHours = new Intl.NumberFormat("th-TH").format(totalHoursPlayed);

  useEffect(() => {
    try {
      setGames(readSteamCollection(ownerKey));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "อ่านคลังเกมไม่สำเร็จ");
    }
  }, [ownerKey]);

  useEffect(() => {
    if (!gameToRemove) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setGameToRemove(null);
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [gameToRemove]);

  function savePlaytime(gameId: number, currentHours: number) {
    const draft = playtimeDrafts[gameId];
    const hours = draft === undefined ? currentHours : Number(draft);
    if (!Number.isInteger(hours) || hours < 0 || hours > 100000) {
      setError("ชั่วโมงเล่นต้องเป็นจำนวนเต็มตั้งแต่ 0 ถึง 100,000 ชั่วโมง");
      return;
    }

    try {
      setGames(updateSteamGamePlaytime(ownerKey, gameId, hours));
      setPlaytimeDrafts((current) => {
        const updated = { ...current };
        delete updated[gameId];
        return updated;
      });
      setError("");
      setNotice("บันทึกเวลาเล่นแล้ว");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "บันทึกเวลาเล่นไม่สำเร็จ");
    }
  }

  function removeGame(gameId: number) {
    try {
      setGames(removeSteamGameFromCollection(ownerKey, gameId));
      setNotice("");
      setError("");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "นำเกมออกจากคลังไม่สำเร็จ");
    }
  }

  function startAddingGame() {
    setGameToEdit(null);
    setAdminGameDraft(EMPTY_ADMIN_GAME);
    setAdminFormOpen(true);
    setError("");
    setNotice("");
  }

  function startEditingGame(game: LibraryGame) {
    setGameToEdit(game);
    setAdminGameDraft({
      name: game.name,
      image: game.image,
      price: game.price,
      originalPrice: game.originalPrice,
    });
    setAdminFormOpen(true);
    setError("");
    setNotice("");
  }

  function saveAdminGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin) return;

    try {
      if (gameToEdit) {
        setGames(updateAdminGameInCollection(ownerKey, gameToEdit.id, adminGameDraft));
        setNotice("แก้ไขข้อมูลเกมแล้ว");
      } else {
        setGames(addAdminGameToCollection(ownerKey, adminGameDraft));
        setNotice("เพิ่มเกมเข้าคลังแล้ว");
      }
      setAdminFormOpen(false);
      setGameToEdit(null);
      setAdminGameDraft(EMPTY_ADMIN_GAME);
      setError("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "บันทึกข้อมูลเกมไม่สำเร็จ");
    }
  }

  return (
    <>
      {error && <p role="alert" className="notice notice-error">{error}</p>}
      {notice && <p role="status" className="notice notice-success">{notice}</p>}
      {isAdmin && (
        <section className="admin-library-tools" aria-label="เครื่องมือแอดมิน">
          <div>
            <span className="admin-library-badge">ADMIN</span>
            <p className="admin-library-description">จัดการเกมในคลังส่วนตัวของบัญชีนี้</p>
          </div>
          <button type="button" onClick={startAddingGame} className="button button-admin-add">
            <Plus aria-hidden="true" className="icon" />
            เพิ่มเกม
          </button>
        </section>
      )}
      {isAdmin && adminFormOpen && (
        <form className="admin-game-form" onSubmit={saveAdminGame}>
          <div className="admin-game-form-heading">
            <div>
              <p className="section-eyebrow">ADMIN · คลังส่วนตัว</p>
              <h2>{gameToEdit ? "แก้ไขข้อมูลเกม" : "เพิ่มเกมเข้าคลัง"}</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setAdminFormOpen(false);
                setGameToEdit(null);
                setError("");
              }}
              aria-label="ปิดแบบฟอร์ม"
              className="button-icon"
            >
              <X aria-hidden="true" className="icon" />
            </button>
          </div>
          <div className="admin-game-form-grid">
            <label className="admin-game-field">
              <span>ชื่อเกม</span>
              <input
                required
                maxLength={120}
                value={adminGameDraft.name}
                onChange={(event) => setAdminGameDraft((draft) => ({ ...draft, name: event.target.value }))}
                placeholder="เช่น The Witcher 3"
              />
            </label>
            <label className="admin-game-field admin-game-field-wide">
              <span>URL รูปภาพปก</span>
              <input
                required
                type="url"
                value={adminGameDraft.image}
                onChange={(event) => setAdminGameDraft((draft) => ({ ...draft, image: event.target.value }))}
                placeholder="https://..."
              />
            </label>
            <label className="admin-game-field">
              <span>ราคาปัจจุบัน</span>
              <input
                value={adminGameDraft.price ?? ""}
                onChange={(event) => setAdminGameDraft((draft) => ({ ...draft, price: event.target.value || null }))}
                placeholder="เช่น ฿599.00 หรือ ฟรี"
              />
            </label>
            <label className="admin-game-field">
              <span>ราคาปกติ (ถ้ามี)</span>
              <input
                value={adminGameDraft.originalPrice ?? ""}
                onChange={(event) => setAdminGameDraft((draft) => ({ ...draft, originalPrice: event.target.value || null }))}
                placeholder="เช่น ฿1,199.00"
              />
            </label>
          </div>
          <div className="admin-game-form-actions">
            <button type="button" onClick={() => setAdminFormOpen(false)} className="button button-secondary">
              ยกเลิก
            </button>
            <button type="submit" className="button button-primary">
              <Save aria-hidden="true" className="icon" />
              {gameToEdit ? "บันทึกการแก้ไข" : "เพิ่มเกม"}
            </button>
          </div>
        </form>
      )}
      {games.length > 0 ? (
        <>
          <div className="library-stats">
            <div className="library-stat">
              <p className="library-stat-label">เกมในคลัง</p>
              <p className="library-stat-value">{games.length}</p>
            </div>
            <div className="library-stat library-stat-highlight">
              <p className="library-stat-label">เวลาเล่นรวม</p>
              <p className="library-stat-value">{formattedTotalHours} <span>ชม.</span></p>
            </div>
          </div>
          <div className="library-grid">
            {games.map((game) => (
              <article key={game.id} className="library-card">
                <div className="library-card-image-wrap">
                  <img
                    src={game.image}
                    alt={`${game.name} ภาพปกเกม`}
                    className="library-card-image"
                    onError={(event) => {
                      if (game.fallbackImage && event.currentTarget.src !== game.fallbackImage) {
                        event.currentTarget.src = game.fallbackImage;
                      }
                    }}
                  />
                  <div className="library-card-image-shade" />
                  <span className="library-owned-badge">
                    <Gamepad2 aria-hidden="true" className="icon icon-small" />
                    ซื้อแล้ว
                  </span>
                  <span className="library-playtime-badge">
                    เล่นแล้ว {game.hoursPlayed} ชม.
                  </span>
                </div>
                <div className="library-card-content">
                  <h2 className="library-card-title">{game.name}</h2>
                  <div className="library-price-row">
                    <span className="library-price-label">ราคาที่บันทึกไว้</span>
                    <div className="library-card-price">
                      {game.originalPrice && <span className="price-original">{game.originalPrice}</span>}
                      <span className="price-current">{game.price ?? "ไม่ระบุ"}</span>
                    </div>
                  </div>
                  <div className="playtime-editor">
                    <label htmlFor={`playtime-${game.id}`} className="playtime-label">
                      อัปเดตเวลาเล่นสะสม
                    </label>
                    <div className="playtime-controls">
                      <input
                        id={`playtime-${game.id}`}
                        type="number"
                        min={0}
                        max={100000}
                        step={1}
                        value={playtimeDrafts[game.id] ?? String(game.hoursPlayed)}
                        onChange={(event) => setPlaytimeDrafts((current) => ({ ...current, [game.id]: event.target.value }))}
                        className="playtime-input"
                      />
                      <span className="playtime-unit">ชั่วโมง</span>
                      <button
                        type="button"
                        onClick={() => savePlaytime(game.id, game.hoursPlayed)}
                        aria-label={`บันทึกเวลาเล่น ${game.name}`}
                        className="button button-save-playtime"
                      >
                        <Save aria-hidden="true" className="icon" />
                        บันทึก
                      </button>
                    </div>
                  </div>
                  <div className="library-card-meta">
                    <span className="library-purchase-date">
                      {game.purchasedAt
                        ? `เพิ่มเข้าคลัง ${new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(game.purchasedAt))}`
                        : "เกมในคลังของคุณ"}
                    </span>
                    <div className="library-card-actions">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => startEditingGame(game)}
                          aria-label={`แก้ไข ${game.name}`}
                          className="button-icon button-edit-game"
                        >
                          <Pencil aria-hidden="true" className="icon icon-small" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setGameToRemove(game)}
                        aria-label={`นำ ${game.name} ออกจากคลัง`}
                        className="button-icon button-remove"
                      >
                        <Trash2 aria-hidden="true" className="icon icon-small" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <ShoppingCart aria-hidden="true" className="icon empty-state-icon" />
          <h2 className="empty-state-title">คลังเกมยังว่างอยู่</h2>
          <p className="empty-state-description">เกมที่ยืนยันว่าซื้อแล้วจะแสดงที่นี่ พร้อมภาพปกและเวลาเล่นสะสม</p>
          <Link href="/cart" className="button button-primary empty-state-action">
            <ShoppingCart aria-hidden="true" className="icon" />
            ไปที่ตะกร้า
          </Link>
        </div>
      )}
      {gameToRemove && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setGameToRemove(null);
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-game-title"
            aria-describedby="remove-game-description"
            className="purchase-dialog library-delete-dialog"
          >
            <div className="library-delete-game">
              <img
                src={gameToRemove.image}
                alt={`${gameToRemove.name} ภาพปกเกม`}
                className="library-delete-image"
                onError={(event) => {
                  if (gameToRemove.fallbackImage && event.currentTarget.src !== gameToRemove.fallbackImage) {
                    event.currentTarget.src = gameToRemove.fallbackImage;
                  }
                }}
              />
              <button
                type="button"
                autoFocus
                onClick={() => setGameToRemove(null)}
                aria-label="ปิดหน้าต่างยืนยัน"
                className="button-icon modal-close"
              >
                <X aria-hidden="true" className="icon" />
              </button>
            </div>
            <div className="purchase-dialog-content">
              <span className="library-delete-eyebrow">
                <Trash2 aria-hidden="true" className="icon" />
                ยืนยันการนำออก
              </span>
              <h2 id="remove-game-title" className="purchase-dialog-title">
                นำเกมออกจากคลัง?
              </h2>
              <p id="remove-game-description" className="purchase-dialog-description">
                <strong className="purchase-dialog-game-name">{gameToRemove.name}</strong> จะถูกนำออกจากคลังเกมนี้ แต่การกระทำนี้ไม่ได้ถอนการติดตั้งเกมจากเครื่องของคุณ
              </p>
              <div className="purchase-dialog-actions">
                <button
                  type="button"
                  onClick={() => setGameToRemove(null)}
                  className="button button-secondary"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeGame(gameToRemove.id);
                    setGameToRemove(null);
                  }}
                  className="button button-danger"
                >
                  <Trash2 aria-hidden="true" className="icon" />
                  นำออกจากคลัง
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
