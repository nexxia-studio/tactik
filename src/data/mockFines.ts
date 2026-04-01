/* ── Fines mock data matching Supabase schema names ── */

export interface FineRule {
  id: string;
  label: string;
  amount: number;
  is_active: boolean;
}

export interface Fine {
  id: string;
  player_id: string;
  player_name: string;
  rule_id: string;
  rule_label: string;
  amount: number;
  date: string;
  is_paid: boolean;
  created_by: string;
}

export interface TreasuryExpense {
  id: string;
  label: string;
  amount: number;
  date: string;
  created_by: string;
}

export interface Treasury {
  total_collected: number;
  total_spent: number;
  season_goal: string;
  goal_amount: number;
}

export const MOCK_FINE_RULES: FineRule[] = [
  { id: "r1", label: "Retard entraînement", amount: 2.00, is_active: true },
  { id: "r2", label: "Absence non excusée", amount: 5.00, is_active: true },
  { id: "r3", label: "Carton jaune", amount: 3.00, is_active: true },
  { id: "r4", label: "Carton rouge", amount: 10.00, is_active: true },
  { id: "r5", label: "Oubli maillot", amount: 5.00, is_active: true },
  { id: "r6", label: "Téléphone réunion", amount: 2.00, is_active: true },
];

export const MOCK_FINES: Fine[] = [
  { id: "f1", player_id: "fp1", player_name: "Nicolas Pirard",     rule_id: "r3", rule_label: "Carton jaune",         amount: 3.00, date: "2025-01-25", is_paid: true,  created_by: "Marc Lecomte" },
  { id: "f2", player_id: "fp2", player_name: "Kevin Lambert",      rule_id: "r3", rule_label: "Carton jaune",         amount: 3.00, date: "2025-01-25", is_paid: false, created_by: "Marc Lecomte" },
  { id: "f3", player_id: "fp3", player_name: "Maxime Gilles",      rule_id: "r1", rule_label: "Retard entraînement",  amount: 2.00, date: "2025-01-21", is_paid: true,  created_by: "Marc Lecomte" },
  { id: "f4", player_id: "fp4", player_name: "Dylan Houben",       rule_id: "r2", rule_label: "Absence non excusée",  amount: 5.00, date: "2025-01-23", is_paid: false, created_by: "Marc Lecomte" },
  { id: "f5", player_id: "fp5", player_name: "Alexis Warnier",     rule_id: "r2", rule_label: "Absence non excusée",  amount: 5.00, date: "2025-01-21", is_paid: false, created_by: "Marc Lecomte" },
  { id: "f6", player_id: "fp6", player_name: "Sébastien Collin",   rule_id: "r3", rule_label: "Carton jaune",         amount: 3.00, date: "2025-10-05", is_paid: true,  created_by: "Marc Lecomte" },
  { id: "f7", player_id: "fp7", player_name: "Thomas Lejeune",     rule_id: "r1", rule_label: "Retard entraînement",  amount: 2.00, date: "2025-01-28", is_paid: true,  created_by: "Marc Lecomte" },
  { id: "f8", player_id: "fp1", player_name: "Nicolas Pirard",     rule_id: "r6", rule_label: "Téléphone réunion",    amount: 2.00, date: "2025-01-28", is_paid: false, created_by: "Marc Lecomte" },
];

export const MOCK_EXPENSES: TreasuryExpense[] = [
  { id: "e1", label: "Achat ballons d'entraînement", amount: 32.00, date: "2025-01-15", created_by: "Marc Lecomte" },
  { id: "e2", label: "Cônes et chasubles",            amount: 10.00, date: "2024-12-10", created_by: "Marc Lecomte" },
];

export const MOCK_TREASURY: Treasury = {
  total_collected: 89.00,
  total_spent: 42.00,
  season_goal: "Souper de fin de saison",
  goal_amount: 200.00,
};

/* Players list for dropdowns */
export const FINE_PLAYERS = [
  { id: "fp1", name: "Nicolas Pirard",   jersey: 9 },
  { id: "fp2", name: "Kevin Lambert",    jersey: 7 },
  { id: "fp3", name: "Maxime Gilles",    jersey: 10 },
  { id: "fp4", name: "Dylan Houben",     jersey: 14 },
  { id: "fp5", name: "Alexis Warnier",   jersey: 11 },
  { id: "fp6", name: "Sébastien Collin", jersey: 4 },
  { id: "fp7", name: "Thomas Lejeune",   jersey: 8 },
  { id: "fp8", name: "Mathis Dumoulin",  jersey: 1 },
  { id: "fp9", name: "Loïc Franssen",    jersey: 2 },
  { id: "fp10", name: "Hugo Malempré",   jersey: 6 },
];
