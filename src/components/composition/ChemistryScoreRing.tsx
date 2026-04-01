interface Props {
  score: number;
}

export function ChemistryScoreRing({ score }: Props) {
  const radius = 50;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color =
    score >= 75 ? "var(--chem-optimal)" :
    score >= 50 ? "var(--chem-good)" :
    score >= 25 ? "var(--chem-weak)" :
    "var(--chem-bad)";
  const glowClass = score > 75 ? "glow-text-primary" : "";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[120px] h-[120px]">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Background ring */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className="transition-all duration-500"
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-display text-[48px] leading-none ${glowClass}`} style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <span className="font-ui text-t-muted text-[var(--text-small)]">/100</span>
    </div>
  );
}
