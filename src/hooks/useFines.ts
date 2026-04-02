import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FineRule {
  id: string;
  team_id: string;
  label: string;
  amount: number;
  is_active: boolean;
  created_at: string;
}

export interface Fine {
  id: string;
  team_id: string;
  player_id: string;
  fine_rule_id: string | null;
  created_by: string;
  reason: string;
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  // joined
  players: { full_name: string; shirt_number: number | null } | null;
  fine_rules: { label: string } | null;
}

export interface Treasury {
  id: string;
  team_id: string;
  total_collected: number;
  total_spent: number;
  season_goal: string | null;
  goal_amount: number | null;
  updated_at: string;
}

export interface TreasuryExpense {
  id: string;
  team_id: string;
  created_by: string;
  label: string;
  amount: number;
  spent_at: string;
  created_at: string;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export function useFineRules(teamId: string | undefined) {
  return useQuery({
    queryKey: ["fine_rules", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fine_rules")
        .select("*")
        .eq("team_id", teamId!)
        .order("label");
      if (error) throw error;
      return data as FineRule[];
    },
  });
}

export function useFines(teamId: string | undefined) {
  return useQuery({
    queryKey: ["fines", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fines")
        .select("*, players(full_name, shirt_number), fine_rules(label)")
        .eq("team_id", teamId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Fine[];
    },
  });
}

export function useTreasury(teamId: string | undefined) {
  return useQuery({
    queryKey: ["treasury", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_treasury")
        .select("*")
        .eq("team_id", teamId!)
        .maybeSingle();
      if (error) throw error;
      return data as Treasury | null;
    },
  });
}

export function useTreasuryExpenses(teamId: string | undefined) {
  return useQuery({
    queryKey: ["treasury_expenses", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treasury_expenses")
        .select("*")
        .eq("team_id", teamId!)
        .order("spent_at", { ascending: false });
      if (error) throw error;
      return data as TreasuryExpense[];
    },
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateFine(teamId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      player_id: string;
      fine_rule_id: string | null;
      reason: string;
      amount: number;
    }) => {
      if (!teamId || !user) throw new Error("Not ready");
      const { error } = await supabase.from("fines").insert({
        team_id: teamId,
        player_id: input.player_id,
        fine_rule_id: input.fine_rule_id || null,
        created_by: user.id,
        reason: input.reason,
        amount: input.amount,
        is_paid: false,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fines", teamId] }),
  });
}

export function useMarkFinePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, teamId }: { id: string; teamId: string }) => {
      const { error } = await supabase
        .from("fines")
        .update({ is_paid: true, paid_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { teamId }) => {
      qc.invalidateQueries({ queryKey: ["fines", teamId] });
      qc.invalidateQueries({ queryKey: ["treasury", teamId] });
    },
  });
}

export function useDeleteFine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, teamId }: { id: string; teamId: string }) => {
      const { error } = await supabase.from("fines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { teamId }) => qc.invalidateQueries({ queryKey: ["fines", teamId] }),
  });
}

export function useCreateFineRule(teamId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { label: string; amount: number; is_active: boolean }) => {
      if (!teamId) throw new Error("No team selected");
      const { error } = await supabase.from("fine_rules").insert({
        team_id: teamId,
        label: input.label,
        amount: input.amount,
        is_active: input.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fine_rules", teamId] }),
  });
}

export function useToggleFineRuleActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active, teamId }: { id: string; is_active: boolean; teamId: string }) => {
      const { error } = await supabase.from("fine_rules").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { teamId }) => qc.invalidateQueries({ queryKey: ["fine_rules", teamId] }),
  });
}

export function useDeleteFineRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, teamId }: { id: string; teamId: string }) => {
      const { error } = await supabase.from("fine_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { teamId }) => qc.invalidateQueries({ queryKey: ["fine_rules", teamId] }),
  });
}

export function useCreateExpense(teamId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { label: string; amount: number; spent_at: string }) => {
      if (!teamId || !user) throw new Error("Not ready");
      const { error } = await supabase.from("treasury_expenses").insert({
        team_id: teamId,
        created_by: user.id,
        label: input.label,
        amount: input.amount,
        spent_at: input.spent_at,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treasury_expenses", teamId] });
      qc.invalidateQueries({ queryKey: ["treasury", teamId] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, teamId }: { id: string; teamId: string }) => {
      const { error } = await supabase.from("treasury_expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { teamId }) => {
      qc.invalidateQueries({ queryKey: ["treasury_expenses", teamId] });
      qc.invalidateQueries({ queryKey: ["treasury", teamId] });
    },
  });
}

export function useUpsertTreasuryGoal(teamId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { season_goal: string; goal_amount: number }) => {
      if (!teamId) throw new Error("No team selected");
      const { error } = await supabase.from("team_treasury").upsert(
        { team_id: teamId, season_goal: input.season_goal, goal_amount: input.goal_amount },
        { onConflict: "team_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["treasury", teamId] }),
  });
}
