import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Player {
  id: string;
  user_id: string | null;
  full_name: string;
  nickname: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  position_preferred: string | null;
  position_alternative_1: string | null;
  position_alternative_2: string | null;
  foot_preferred: string | null;
  shirt_number: number | null;
  strengths_tags: string[] | null;
  weaknesses_tags: string[] | null;
  xp_points: number;
  level: number;
  is_claimed: boolean;
  created_at: string;
}

// Fetch all players belonging to a team (via team_members join)
export function usePlayers(teamId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["players", teamId],
    enabled: !!user && !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("players(*)")
        .eq("team_id", teamId!)
        .not("player_id", "is", null)
        .order("players(full_name)");

      if (error) throw error;

      return (data ?? [])
        .map((row: any) => row.players as Player)
        .filter(Boolean);
    },
  });
}

export function useTeams() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["teams"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("team_id, teams(*)")
        .eq("user_id", user!.id)
        .eq("role", "coach");
      if (error) throw error;
      return (data ?? []).map((row: any) => row.teams).filter(Boolean);
    },
  });
}

export type PlayerWriteFields = {
  full_name: string;
  nickname: string | null;
  avatar_url: string | null;
  position_preferred: string | null;
  position_alternative_1: string | null;
  position_alternative_2: string | null;
  foot_preferred: string | null;
  shirt_number: number | null;
  strengths_tags: string[];
  weaknesses_tags: string[];
};

export function useAddPlayer(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (playerData: PlayerWriteFields) => {
      // 1. Create the player record
      const { data: player, error: playerErr } = await supabase
        .from("players")
        .insert(playerData)
        .select()
        .single();
      if (playerErr) throw playerErr;

      // 2. Link player to team via team_members
      const { error: memberErr } = await supabase
        .from("team_members")
        .insert({ team_id: teamId, player_id: player.id, role: "player" });
      if (memberErr) throw memberErr;

      return player as Player;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["players", teamId] }),
  });
}

export function useUpdatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<PlayerWriteFields> & { id: string }) => {
      const { data, error } = await supabase
        .from("players")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Player;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["players"] }),
  });
}

export function useDeletePlayer(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (playerId: string) => {
      // Remove player from team (deletes team_members row only)
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", teamId)
        .eq("player_id", playerId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["players", teamId] }),
  });
}

export async function uploadPlayerAvatar(file: File, playerId: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${playerId}.${ext}`;

  const { error } = await supabase.storage
    .from("player-avatars")
    .upload(path, file, { upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from("player-avatars").getPublicUrl(path);
  return data.publicUrl;
}
