/** Mock players for FUT composition */

export type PlayerStatus = "available" | "injured" | "suspended" | "unavailable";

export interface FUTPlayer {
  id: string;
  firstName: string;
  lastName: string;
  position: string; // GK, RB, CB, LB, CDM, CM, CAM, RM, LM, RW, LW, ST, etc.
  jerseyNumber: number;
  rating: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  avatarUrl?: string;
  status: PlayerStatus;
}

/** Position category helpers */
export type PositionCategory = "GK" | "DEF" | "MID" | "ATT";

const DEF_POSITIONS = ["RB", "CB", "LB", "RWB", "LWB"];
const MID_POSITIONS = ["CDM", "CM", "CAM", "RM", "LM", "RAM", "LAM"];
const ATT_POSITIONS = ["ST", "RW", "LW", "CF", "SS"];

export function getPositionCategory(position: string): PositionCategory {
  if (position === "GK") return "GK";
  if (DEF_POSITIONS.includes(position)) return "DEF";
  if (MID_POSITIONS.includes(position)) return "MID";
  if (ATT_POSITIONS.includes(position)) return "ATT";
  return "MID"; // fallback
}

export const MOCK_PLAYERS: FUTPlayer[] = [
  // Gardien titulaire
  { id: "1", firstName: "Maxime", lastName: "Dupont", position: "GK", jerseyNumber: 1, rating: 78, pace: 45, shooting: 20, passing: 55, dribbling: 40, defending: 30, physical: 72, status: "available" },
  // Défenseurs
  { id: "5", firstName: "Enzo", lastName: "Claessens", position: "RB", jerseyNumber: 2, rating: 73, pace: 80, shooting: 45, passing: 62, dribbling: 65, defending: 70, physical: 65, status: "available" },
  { id: "2", firstName: "Lucas", lastName: "Mertens", position: "LB", jerseyNumber: 3, rating: 74, pace: 78, shooting: 42, passing: 65, dribbling: 60, defending: 72, physical: 68, status: "available" },
  { id: "3", firstName: "Thomas", lastName: "Leclerc", position: "CB", jerseyNumber: 4, rating: 76, pace: 55, shooting: 35, passing: 52, dribbling: 45, defending: 80, physical: 78, status: "available" },
  { id: "4", firstName: "Nathan", lastName: "Peeters", position: "CB", jerseyNumber: 5, rating: 75, pace: 52, shooting: 30, passing: 50, dribbling: 42, defending: 78, physical: 80, status: "available" },
  // Milieux
  { id: "7", firstName: "Julien", lastName: "Servais", position: "CDM", jerseyNumber: 6, rating: 77, pace: 60, shooting: 55, passing: 75, dribbling: 68, defending: 72, physical: 72, status: "available" },
  { id: "6", firstName: "Antoine", lastName: "Henrard", position: "CM", jerseyNumber: 8, rating: 79, pace: 65, shooting: 68, passing: 78, dribbling: 72, defending: 60, physical: 70, status: "available" },
  { id: "8", firstName: "Rémy", lastName: "Lambert", position: "CAM", jerseyNumber: 10, rating: 82, pace: 68, shooting: 72, passing: 82, dribbling: 80, defending: 48, physical: 62, status: "available" },
  // Attaquants
  { id: "11", firstName: "Dylan", lastName: "Thiry", position: "RW", jerseyNumber: 7, rating: 78, pace: 85, shooting: 70, passing: 65, dribbling: 78, defending: 28, physical: 60, status: "available" },
  { id: "10", firstName: "Kevin", lastName: "Schmitz", position: "ST", jerseyNumber: 9, rating: 83, pace: 82, shooting: 85, passing: 60, dribbling: 75, defending: 25, physical: 76, status: "available" },
  { id: "9", firstName: "Adrien", lastName: "Fontaine", position: "LW", jerseyNumber: 11, rating: 80, pace: 88, shooting: 75, passing: 68, dribbling: 82, defending: 30, physical: 58, status: "available" },
  // Remplaçants
  { id: "12", firstName: "Hugo", lastName: "Bastin", position: "GK", jerseyNumber: 16, rating: 70, pace: 40, shooting: 18, passing: 50, dribbling: 35, defending: 28, physical: 68, status: "available" },
  { id: "13", firstName: "Arnaud", lastName: "Delcourt", position: "CB", jerseyNumber: 14, rating: 72, pace: 50, shooting: 28, passing: 48, dribbling: 40, defending: 74, physical: 76, status: "available" },
  { id: "14", firstName: "Bryan", lastName: "Collin", position: "CM", jerseyNumber: 15, rating: 71, pace: 62, shooting: 50, passing: 68, dribbling: 62, defending: 55, physical: 65, status: "available" },
  { id: "15", firstName: "Loïc", lastName: "Warnier", position: "RW", jerseyNumber: 17, rating: 70, pace: 82, shooting: 58, passing: 55, dribbling: 72, defending: 22, physical: 55, status: "available" },
  { id: "16", firstName: "Cédric", lastName: "Franssen", position: "ST", jerseyNumber: 18, rating: 69, pace: 75, shooting: 72, passing: 48, dribbling: 62, defending: 20, physical: 70, status: "available" },
  // Blessés / Suspendus / Indisponibles
  { id: "17", firstName: "Olivier", lastName: "Xhaard", position: "LB", jerseyNumber: 13, rating: 73, pace: 76, shooting: 38, passing: 60, dribbling: 58, defending: 70, physical: 72, status: "injured" },
  { id: "18", firstName: "Simon", lastName: "Gérardy", position: "CM", jerseyNumber: 12, rating: 75, pace: 64, shooting: 60, passing: 72, dribbling: 70, defending: 58, physical: 66, status: "suspended" },
  { id: "19", firstName: "Pierre", lastName: "Nissen", position: "ST", jerseyNumber: 19, rating: 68, pace: 78, shooting: 65, passing: 45, dribbling: 60, defending: 18, physical: 62, status: "unavailable" },
];
