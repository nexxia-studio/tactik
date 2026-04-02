import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useTeams } from "@/hooks/usePlayers";

const STORAGE_KEY = "tactik_active_team_id";

export interface TeamRow {
  id: string;
  name: string;
  category: string | null;
  organization_id: string;
  season_id: string | null;
}

interface TeamContextValue {
  teams: TeamRow[];
  teamsLoading: boolean;
  activeTeamId: string | undefined;
  activeTeam: TeamRow | undefined;
  setActiveTeamId: (id: string) => void;
}

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { data: rawTeams = [], isLoading: teamsLoading } = useTeams();
  const teams = rawTeams as TeamRow[];

  const [storedId, setStoredId] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );

  // Prefer stored ID if still valid; fall back to first team
  const activeTeamId = useMemo<string | undefined>(() => {
    if (!teams.length) return undefined;
    if (storedId && teams.some((t) => t.id === storedId)) return storedId;
    return teams[0].id;
  }, [teams, storedId]);

  // Keep localStorage in sync when the resolved ID changes
  useEffect(() => {
    if (activeTeamId && activeTeamId !== storedId) {
      localStorage.setItem(STORAGE_KEY, activeTeamId);
      setStoredId(activeTeamId);
    }
  }, [activeTeamId, storedId]);

  const setActiveTeamId = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setStoredId(id);
  };

  const activeTeam = teams.find((t) => t.id === activeTeamId);

  return (
    <TeamContext.Provider
      value={{ teams, teamsLoading, activeTeamId, activeTeam, setActiveTeamId }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useActiveTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error("useActiveTeam must be used inside <TeamProvider>");
  return ctx;
}
