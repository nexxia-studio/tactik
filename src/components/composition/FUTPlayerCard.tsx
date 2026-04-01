import type { FUTPlayer } from "./mockPlayers";

interface Props {
  player: FUTPlayer;
  positionLabel: string;
  isSelected?: boolean;
  compact?: boolean;
}

export function FUTPlayerCard({ player, positionLabel, compact }: Props) {
  const ratingColor =
    player.rating >= 80
      ? "text-[var(--color-success)]"
      : player.rating >= 70
        ? "text-[var(--color-warning)]"
        : "text-t-primary";

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-0.5 group cursor-pointer">
        {/* Card */}
        <div className="relative w-[52px] h-[68px] sm:w-[60px] sm:h-[78px] bg-bg-surface-2 border border-b-default rounded-lg overflow-hidden flex flex-col items-center justify-center transition-all group-hover:border-primary group-hover:glow-primary">
          {/* Rating */}
          <span className={`font-display text-[16px] sm:text-[18px] leading-none ${ratingColor}`}>
            {player.rating}
          </span>
          {/* Position */}
          <span className="font-ui text-[8px] sm:text-[9px] text-t-muted uppercase tracking-wider mt-0.5">
            {positionLabel}
          </span>
          {/* Jersey */}
          <span className="font-ui text-[10px] sm:text-[11px] text-t-secondary mt-0.5">
            #{player.jerseyNumber}
          </span>
        </div>
        {/* Name below card */}
        <span className="font-ui text-[9px] sm:text-[10px] text-t-secondary uppercase tracking-wider max-w-[60px] sm:max-w-[70px] truncate text-center">
          {player.lastName}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface-2 border border-b-default rounded-xl p-3 w-full max-w-[140px]">
      {/* Top: rating + position */}
      <div className="flex items-baseline justify-between mb-2">
        <span className={`font-display text-[22px] leading-none ${ratingColor}`}>
          {player.rating}
        </span>
        <span className="font-ui text-[10px] text-t-muted uppercase tracking-wider">
          {positionLabel}
        </span>
      </div>
      {/* Name */}
      <p className="font-ui text-[12px] text-t-primary truncate">{player.lastName}</p>
      <p className="font-ui text-[10px] text-t-secondary">{player.firstName}</p>
      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 mt-2">
        {[
          { label: "PAC", val: player.pace },
          { label: "SHO", val: player.shooting },
          { label: "PAS", val: player.passing },
          { label: "DRI", val: player.dribbling },
          { label: "DEF", val: player.defending },
          { label: "PHY", val: player.physical },
        ].map((s) => (
          <div key={s.label} className="flex items-baseline gap-1">
            <span className="font-ui text-[8px] text-t-muted uppercase">{s.label}</span>
            <span className="font-ui text-[10px] text-t-primary">{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
