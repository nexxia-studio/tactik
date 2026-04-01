import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Player {
  id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  position: string;
  jersey_number: number | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export function usePlayers(teamId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["players", teamId],
    enabled: !!user && !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("team_id", teamId!)
        .order("last_name");
      if (error) throw error;
      return data as Player[];
    },
  });
}

export function useTeams() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["teams"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useAddPlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (player: Omit<Player, "id" | "created_at">) => {
      const { data, error } = await supabase.from("players").insert(player).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["players"] }),
  });
}

export function useUpdatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Player> & { id: string }) => {
      const { data, error } = await supabase.from("players").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["players"] }),
  });
}

export function useDeletePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("players").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["players"] }),
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
