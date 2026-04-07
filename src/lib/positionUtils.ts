export interface PositionColor {
  bg: string;
  text: string;
  border: string;
  short: string; // for compact badges
}

const FALLBACK: PositionColor = {
  bg: "bg-bg-surface-2",
  text: "text-t-secondary",
  border: "border-transparent",
  short: "?",
};

const GK: PositionColor    = { bg: "bg-blue-500/20",   text: "text-blue-400",   border: "border-blue-500/30",   short: "GK"  };
const DEF: PositionColor   = { bg: "bg-red-500/20",    text: "text-red-400",    border: "border-red-500/30",    short: "DEF" };
const MID: PositionColor   = { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30", short: "MIL" };
const ATT: PositionColor   = { bg: "bg-green-500/20",  text: "text-green-400",  border: "border-green-500/30",  short: "ATT" };

const MAP: Record<string, PositionColor> = {
  // ── French full names ────────────────────────────────────────
  "Gardien":            GK,
  // Défenseurs
  "Défenseur":          DEF,
  "Défenseur central":  DEF,
  "Arrière droit":      DEF,
  "Arrière gauche":     DEF,
  // Milieux
  "Milieu":             MID,
  "Milieu défensif":    MID,
  "Milieu central":     MID,
  "Milieu offensif":    MID,
  // Attaquants
  "Attaquant":          ATT,
  "Attaquant centre":   ATT,
  "Avant-centre":       ATT,
  "Ailier droit":       ATT,
  "Ailier gauche":      ATT,

  // ── Short codes (FUTPlayer / formation slots) ────────────────
  "GK":  GK,
  // Defenders
  "CB":  DEF, "RB":  DEF, "LB":  DEF, "RWB": DEF, "LWB": DEF,
  // Midfielders
  "CDM": MID, "CM":  MID, "CAM": MID,
  "RM":  MID, "LM":  MID, "RAM": MID, "LAM": MID,
  // Forwards
  "RW":  ATT, "LW":  ATT, "CF":  ATT, "SS":  ATT, "ST":  ATT,
};

export function getPositionColor(position: string): PositionColor {
  return MAP[position] ?? FALLBACK;
}
