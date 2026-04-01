import { Search } from "lucide-react";

const POSITIONS = ["Tous", "Gardien", "Défenseur", "Milieu", "Attaquant"];

interface PlayerFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  position: string;
  onPositionChange: (value: string) => void;
}

export function PlayerFilters({ search, onSearchChange, position, onPositionChange }: PlayerFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-t-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un joueur…"
          className="w-full font-ui text-[13px] bg-bg-surface-1 border border-b-default
                     text-t-primary rounded-lg pl-9 pr-3 py-2.5 outline-none
                     focus:border-primary transition-colors placeholder:text-t-muted"
        />
      </div>

      {/* Position filter */}
      <div className="flex gap-1.5 flex-wrap">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            onClick={() => onPositionChange(pos)}
            className={`px-3 py-1.5 rounded-lg font-ui text-[12px] transition-all cursor-pointer ${
              position === pos
                ? "bg-primary text-primary-text"
                : "bg-bg-surface-1 text-t-secondary border border-b-subtle hover:bg-bg-surface-2"
            }`}
          >
            {pos}
          </button>
        ))}
      </div>
    </div>
  );
}
