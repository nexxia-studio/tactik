/* ── Communication mock data ── */

export type SelectionStatus = "starter" | "sub" | null;

export interface ConvocationMatch {
  id: string;
  opponent: string;
  date: string;
  location: string;
  is_home: boolean;
}

export interface ConvocationPlayer {
  id: string;
  first_name: string;
  last_name: string;
  jersey_number: number;
  position: string;
  avatar_url: string | null;
}

export interface PastConvocation {
  id: string;
  match: string;
  date: string;
  players_count: number;
  status: "sent" | "draft";
}

export const MOCK_CONVOCATION_MATCHES: ConvocationMatch[] = [
  { id: "m1", opponent: "FC Battice",    date: "2025-04-06T15:00:00", location: "Terrain de Xhoffraix",  is_home: true },
  { id: "m2", opponent: "US Thimister",  date: "2025-04-13T15:00:00", location: "Terrain de Thimister",  is_home: false },
];

export const MOCK_CONVOCATION_PLAYERS: ConvocationPlayer[] = [
  { id: "cp1",  first_name: "Loïc",      last_name: "Renard",     jersey_number: 1,  position: "GK",  avatar_url: null },
  { id: "cp2",  first_name: "Mathieu",   last_name: "Dupont",     jersey_number: 2,  position: "RB",  avatar_url: null },
  { id: "cp3",  first_name: "Antoine",   last_name: "Dethier",    jersey_number: 3,  position: "CB",  avatar_url: null },
  { id: "cp4",  first_name: "Julien",    last_name: "Collin",     jersey_number: 4,  position: "CB",  avatar_url: null },
  { id: "cp5",  first_name: "Nathan",    last_name: "Xhoffraix",  jersey_number: 5,  position: "LB",  avatar_url: null },
  { id: "cp6",  first_name: "Hugo",      last_name: "Malempré",   jersey_number: 6,  position: "CDM", avatar_url: null },
  { id: "cp7",  first_name: "Kevin",     last_name: "Lambert",    jersey_number: 7,  position: "RW",  avatar_url: null },
  { id: "cp8",  first_name: "Tom",       last_name: "Servais",    jersey_number: 8,  position: "CM",  avatar_url: null },
  { id: "cp9",  first_name: "Maxime",    last_name: "Gilles",     jersey_number: 10, position: "CAM", avatar_url: null },
  { id: "cp10", first_name: "Nicolas",   last_name: "Pirard",     jersey_number: 9,  position: "ST",  avatar_url: null },
  { id: "cp11", first_name: "Alexis",    last_name: "Warnier",    jersey_number: 11, position: "LW",  avatar_url: null },
  { id: "cp12", first_name: "Pierre",    last_name: "Xhonneux",   jersey_number: 12, position: "GK",  avatar_url: null },
  { id: "cp13", first_name: "Dylan",     last_name: "Houben",     jersey_number: 14, position: "CM",  avatar_url: null },
  { id: "cp14", first_name: "Sébastien", last_name: "Collin",     jersey_number: 15, position: "CB",  avatar_url: null },
  { id: "cp15", first_name: "Thomas",    last_name: "Lejeune",    jersey_number: 16, position: "CM",  avatar_url: null },
  { id: "cp16", first_name: "Romain",    last_name: "Hardy",      jersey_number: 17, position: "RW",  avatar_url: null },
  { id: "cp17", first_name: "Enzo",      last_name: "Fagnoul",    jersey_number: 19, position: "ST",  avatar_url: null },
  { id: "cp18", first_name: "Arnaud",    last_name: "Delcour",    jersey_number: 20, position: "LB",  avatar_url: null },
];

export interface FUTComposition {
  id: string;
  match_id: string;
  formation: string;
  starters: { player_id: string; position: string }[];
  substitutes: string[];
}

/**
 * Mock FUT compositions linked to matches.
 * Maps player IDs from MOCK_CONVOCATION_PLAYERS.
 */
export const MOCK_FUT_COMPOSITIONS: FUTComposition[] = [
  {
    id: "fc1",
    match_id: "m1",
    formation: "4-3-3",
    starters: [
      { player_id: "cp1", position: "GK" },
      { player_id: "cp2", position: "RB" },
      { player_id: "cp3", position: "CB" },
      { player_id: "cp4", position: "CB" },
      { player_id: "cp5", position: "LB" },
      { player_id: "cp6", position: "CDM" },
      { player_id: "cp8", position: "CM" },
      { player_id: "cp9", position: "CAM" },
      { player_id: "cp7", position: "RW" },
      { player_id: "cp11", position: "LW" },
      { player_id: "cp10", position: "ST" },
    ],
    substitutes: ["cp12", "cp13", "cp14", "cp15"],
  },
];

export const MOCK_PAST_CONVOCATIONS: PastConvocation[] = [
  { id: "pc1", match: "vs FC Stavelot", date: "2025-01-25", players_count: 16, status: "sent" },
  { id: "pc2", match: "vs US Malmedy",  date: "2025-01-18", players_count: 14, status: "sent" },
  { id: "pc3", match: "vs RFC Baelen",  date: "2024-11-16", players_count: 17, status: "sent" },
];
