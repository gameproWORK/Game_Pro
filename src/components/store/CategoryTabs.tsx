import { CalendarClock, Flame, Percent, Sparkles, Star } from "lucide-react";
import { GAME_CATEGORIES, type GameCategory } from "@/lib/steam";

const CATEGORY_ICONS = {
  all: Star,
  top_sellers: Flame,
  specials: Percent,
  new_releases: Sparkles,
  coming_soon: CalendarClock,
} satisfies Record<GameCategory, unknown>;

type CategoryTabsProps = {
  active: GameCategory | null;
  disabled?: boolean;
  onChange: (category: GameCategory) => void;
};

export function CategoryTabs({ active, disabled, onChange }: CategoryTabsProps) {
  return (
    <div role="tablist" aria-label="หมวดหมู่เกม" className="category-tabs">
      {GAME_CATEGORIES.map(({ id, label }) => {
        const Icon = CATEGORY_ICONS[id];
        const isActive = id === active;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={`category-tab${isActive ? " is-active" : ""}`}
          >
            <Icon aria-hidden="true" className="icon icon-small" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
