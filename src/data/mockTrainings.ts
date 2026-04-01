/* ── Training types matching Supabase schema names ── */

export type TrainingStatus = "planned" | "in_progress" | "completed";
export type AttendanceStatus = "present" | "late" | "absent" | "excused" | null;
export type PhaseType = "warmup" | "tactical" | "technical" | "scrimmage";
export type DrillSource = "youtube" | "tiktok" | "manual";

export interface Drill {
  id: string;
  name: string;
  duration: number; // minutes
  source: DrillSource;
  source_url?: string;
}

export interface TrainingPhase {
  type: PhaseType;
  duration: number;
  drills: Drill[];
}

export interface TrainingAttendance {
  player_id: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  avatar_url: string | null;
  status: AttendanceStatus;
}

export interface Training {
  id: string;
  scheduled_at: string; // ISO datetime
  location: string;
  status: TrainingStatus;
  notes: string | null;
  phases: TrainingPhase[];
  attendance: TrainingAttendance[];
}

export const PHASE_META: Record<PhaseType, { label: string; color: string; icon: string }> = {
  warmup:    { label: "Échauffement", color: "var(--color-warning)",  icon: "🔥" },
  tactical:  { label: "Tactique",     color: "var(--color-info)",     icon: "🧠" },
  technical: { label: "Technique",    color: "var(--color-warning)",  icon: "🎯" },
  scrimmage: { label: "Match",        color: "var(--color-primary)",  icon: "⚽" },
};

/* ── Mock players for attendance ── */
const MOCK_PLAYERS: Omit<TrainingAttendance, "status">[] = [
  { player_id: "p1",  first_name: "Mathis",   last_name: "Dumoulin",   jersey_number: 1,  avatar_url: null },
  { player_id: "p2",  first_name: "Loïc",     last_name: "Franssen",   jersey_number: 2,  avatar_url: null },
  { player_id: "p3",  first_name: "Antoine",  last_name: "Dethier",    jersey_number: 3,  avatar_url: null },
  { player_id: "p4",  first_name: "Julien",   last_name: "Collin",     jersey_number: 4,  avatar_url: null },
  { player_id: "p5",  first_name: "Nathan",   last_name: "Xhoffraix",  jersey_number: 5,  avatar_url: null },
  { player_id: "p6",  first_name: "Hugo",     last_name: "Malempré",   jersey_number: 6,  avatar_url: null },
  { player_id: "p7",  first_name: "Lucas",    last_name: "Bertrand",   jersey_number: 7,  avatar_url: null },
  { player_id: "p8",  first_name: "Tom",      last_name: "Servais",    jersey_number: 8,  avatar_url: null },
  { player_id: "p9",  first_name: "Maxime",   last_name: "Lejeune",    jersey_number: 9,  avatar_url: null },
  { player_id: "p10", first_name: "Romain",   last_name: "Hardy",      jersey_number: 10, avatar_url: null },
  { player_id: "p11", first_name: "Kevin",    last_name: "Brouwers",   jersey_number: 11, avatar_url: null },
  { player_id: "p12", first_name: "Adrien",   last_name: "Closset",    jersey_number: 14, avatar_url: null },
  { player_id: "p13", first_name: "Dylan",    last_name: "Pirard",     jersey_number: 16, avatar_url: null },
  { player_id: "p14", first_name: "Simon",    last_name: "Mertens",    jersey_number: 17, avatar_url: null },
  { player_id: "p15", first_name: "Enzo",     last_name: "Fagnoul",    jersey_number: 19, avatar_url: null },
  { player_id: "p16", first_name: "Arnaud",   last_name: "Delcour",    jersey_number: 20, avatar_url: null },
  { player_id: "p17", first_name: "Florian",  last_name: "Henrotte",   jersey_number: 22, avatar_url: null },
  { player_id: "p18", first_name: "Théo",     last_name: "Lemaire",    jersey_number: 23, avatar_url: null },
];

function makeAttendance(overrides: Partial<Record<string, AttendanceStatus>>): TrainingAttendance[] {
  return MOCK_PLAYERS.map((p) => ({
    ...p,
    status: overrides[p.player_id] ?? null,
  }));
}

export const MOCK_TRAININGS: Training[] = [
  /* ── Passées ── */
  {
    id: "s1",
    scheduled_at: "2026-01-20T19:30:00",
    location: "Terrain de Xhoffraix",
    status: "completed",
    notes: "Travail défensif avant match Stavelot. Bonne intensité globale, attention aux transitions défensives.",
    phases: [
      { type: "warmup",   duration: 15, drills: [
        { id: "d1", name: "Toros 4v2",          duration: 8,  source: "manual" },
        { id: "d2", name: "Passes courtes",     duration: 7,  source: "youtube", source_url: "https://youtube.com" },
      ]},
      { type: "tactical",  duration: 25, drills: [
        { id: "d3", name: "Bloc défensif bas",  duration: 15, source: "manual" },
        { id: "d4", name: "Pressing haut",      duration: 10, source: "youtube", source_url: "https://youtube.com" },
      ]},
      { type: "technical", duration: 20, drills: [
        { id: "d5", name: "Centres + finitions", duration: 20, source: "tiktok", source_url: "https://tiktok.com" },
      ]},
      { type: "scrimmage", duration: 30, drills: [
        { id: "d6", name: "Match 8v8",          duration: 30, source: "manual" },
      ]},
    ],
    attendance: makeAttendance({
      p1: "present", p2: "present", p3: "present", p4: "present",
      p5: "present", p6: "present", p7: "late", p8: "present",
      p9: "present", p10: "present", p11: "present", p12: "absent",
      p13: "present", p14: "present", p15: "excused", p16: "present",
      p17: "absent", p18: "present",
    }),
  },
  {
    id: "s2",
    scheduled_at: "2026-01-27T19:30:00",
    location: "Terrain de Xhoffraix",
    status: "completed",
    notes: "Séance axée sur la possession. Les milieux doivent mieux se démarquer.",
    phases: [
      { type: "warmup",   duration: 10, drills: [
        { id: "d7", name: "Jeu de position 5v3", duration: 10, source: "manual" },
      ]},
      { type: "tactical",  duration: 30, drills: [
        { id: "d8", name: "Possession 6v4+2",    duration: 15, source: "youtube", source_url: "https://youtube.com" },
        { id: "d9", name: "Sorties de balle",     duration: 15, source: "manual" },
      ]},
      { type: "technical", duration: 20, drills: [
        { id: "d10", name: "Contrôle orienté",    duration: 10, source: "manual" },
        { id: "d11", name: "Une-deux + frappe",   duration: 10, source: "tiktok", source_url: "https://tiktok.com" },
      ]},
      { type: "scrimmage", duration: 25, drills: [
        { id: "d12", name: "Match 9v9",           duration: 25, source: "manual" },
      ]},
    ],
    attendance: makeAttendance({
      p1: "present", p2: "present", p3: "absent", p4: "present",
      p5: "present", p6: "excused", p7: "present", p8: "present",
      p9: "present", p10: "late", p11: "present", p12: "present",
      p13: "present", p14: "present", p15: "present", p16: "absent",
      p17: "present", p18: "present",
    }),
  },
  {
    id: "s3",
    scheduled_at: "2026-03-24T19:30:00",
    location: "Terrain de Xhoffraix",
    status: "completed",
    notes: "Veille de match contre Heusy. Séance courte, focus set pieces.",
    phases: [
      { type: "warmup",   duration: 10, drills: [
        { id: "d13", name: "Activation dynamique", duration: 10, source: "manual" },
      ]},
      { type: "tactical", duration: 20, drills: [
        { id: "d14", name: "Corners offensifs",    duration: 10, source: "manual" },
        { id: "d15", name: "Coups francs",          duration: 10, source: "youtube", source_url: "https://youtube.com" },
      ]},
      { type: "technical", duration: 0, drills: [] },
      { type: "scrimmage", duration: 15, drills: [
        { id: "d16", name: "Match réduit 5v5",     duration: 15, source: "manual" },
      ]},
    ],
    attendance: makeAttendance({
      p1: "present", p2: "present", p3: "present", p4: "present",
      p5: "late", p6: "present", p7: "present", p8: "present",
      p9: "present", p10: "present", p11: "present", p12: "present",
      p13: "absent", p14: "present", p15: "present", p16: "present",
      p17: "excused", p18: "present",
    }),
  },
  /* ── À venir ── */
  {
    id: "s4",
    scheduled_at: "2026-04-08T19:30:00",
    location: "Terrain de Xhoffraix",
    status: "planned",
    notes: null,
    phases: [
      { type: "warmup",   duration: 15, drills: [
        { id: "d17", name: "Toros 5v2",         duration: 8,  source: "manual" },
        { id: "d18", name: "Mobilité articulaire", duration: 7,  source: "manual" },
      ]},
      { type: "tactical",  duration: 25, drills: [
        { id: "d19", name: "Transitions off→def", duration: 25, source: "youtube", source_url: "https://youtube.com" },
      ]},
      { type: "technical", duration: 20, drills: [
        { id: "d20", name: "Jeu en profondeur",   duration: 20, source: "manual" },
      ]},
      { type: "scrimmage", duration: 30, drills: [
        { id: "d21", name: "Match 10v10",         duration: 30, source: "manual" },
      ]},
    ],
    attendance: makeAttendance({}),
  },
  {
    id: "s5",
    scheduled_at: "2026-04-15T20:00:00",
    location: "Terrain synthétique Spa",
    status: "planned",
    notes: null,
    phases: [
      { type: "warmup",   duration: 15, drills: [
        { id: "d22", name: "Jeu des 10 passes",  duration: 15, source: "manual" },
      ]},
      { type: "tactical",  duration: 20, drills: [] },
      { type: "technical", duration: 25, drills: [
        { id: "d23", name: "Duels 1v1 latéraux", duration: 12, source: "tiktok", source_url: "https://tiktok.com" },
        { id: "d24", name: "Frappes enchaînées", duration: 13, source: "manual" },
      ]},
      { type: "scrimmage", duration: 25, drills: [
        { id: "d25", name: "Match à thème",      duration: 25, source: "manual" },
      ]},
    ],
    attendance: makeAttendance({}),
  },
];
