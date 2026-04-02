import { useQuery } from "@tanstack/react-query";
import { Shield, Calendar, Trophy, MapPin, Users } from "lucide-react";
import { useActiveTeam } from "@/contexts/TeamContext";
import { supabase } from "@/integrations/supabase/client";

interface Organization {
  id: string;
  name: string;
  short_name: string | null;
  city: string | null;
  logo_url: string | null;
  division: string | null;
}

interface Season {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface Coach {
  id: string;
  full_name: string;
  avatar_url: string | null;
  license_level: string | null;
}

function CoachCard({ coach }: { coach: Coach }) {
  const initials = coach.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="bg-bg-surface-2 border border-b-subtle rounded-xl p-4 flex items-start gap-4 hover:border-primary-border transition-colors">
      {coach.avatar_url ? (
        <img src={coach.avatar_url} alt={coach.full_name} className="h-12 w-12 rounded-full object-cover shrink-0" />
      ) : (
        <div className="h-12 w-12 rounded-full bg-bg-surface-3 flex items-center justify-center shrink-0">
          <span className="font-display text-[11px] text-t-secondary">{initials}</span>
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-ui text-[14px] text-t-primary font-medium truncate">{coach.full_name}</p>
        {coach.license_level && (
          <span className="inline-block font-ui text-[10px] uppercase tracking-[0.12em] font-semibold px-2 py-0.5 rounded-md bg-primary-dim text-primary">
            {coach.license_level}
          </span>
        )}
      </div>
    </div>
  );
}

export default function TeamPage() {
  const { activeTeamId: teamId, activeTeam } = useActiveTeam();

  const { data: org } = useQuery<Organization | null>({
    queryKey: ["organization", activeTeam?.organization_id],
    enabled: !!activeTeam?.organization_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, short_name, city, logo_url, division")
        .eq("id", activeTeam!.organization_id)
        .single();
      if (error) throw error;
      return data as Organization;
    },
  });

  const { data: season } = useQuery<Season | null>({
    queryKey: ["season", activeTeam?.season_id],
    enabled: !!activeTeam?.season_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("id, label, start_date, end_date, is_current")
        .eq("id", activeTeam!.season_id!)
        .single();
      if (error) throw error;
      return data as Season;
    },
  });

  const { data: coaches = [] } = useQuery<Coach[]>({
    queryKey: ["team_coaches", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("coaches(id, full_name, avatar_url, license_level)")
        .eq("team_id", teamId!)
        .not("coach_id", "is", null);
      if (error) throw error;
      return (data ?? [])
        .map((row: any) => row.coaches)
        .filter(Boolean) as Coach[];
    },
  });

  const { data: playerCount = 0 } = useQuery<number>({
    queryKey: ["team_player_count", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("team_id", teamId!)
        .not("player_id", "is", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  return (
    <div className="space-y-8 pb-24 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-[var(--text-h1)] text-t-primary uppercase tracking-wider leading-none">
          Équipe
        </h1>
        <p className="font-ui text-[var(--text-small)] text-t-secondary mt-1">
          Informations du club, saison et encadrement
        </p>
      </div>

      {/* Club info card */}
      <div className="bg-bg-surface-2 border border-b-subtle rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-4">
          {org?.logo_url ? (
            <img src={org.logo_url} alt={org.name} className="h-16 w-16 rounded-xl object-contain" />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-primary-dim border border-primary-border flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          )}
          <div>
            <h2 className="font-display text-[var(--text-h2)] text-t-primary uppercase tracking-wider leading-tight">
              {org?.name ?? "—"}
            </h2>
            <p className="font-ui text-[var(--text-small)] text-t-secondary mt-0.5">
              {activeTeam?.name ?? "—"}{activeTeam?.category ? ` — ${activeTeam.category}` : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Calendar, label: "Saison",   value: season?.label ?? "—"             },
            { icon: Trophy,   label: "Division", value: org?.division ?? "—"             },
            { icon: MapPin,   label: "Ville",    value: org?.city ?? "—"                 },
            { icon: Users,    label: "Effectif", value: `${playerCount} joueur${playerCount !== 1 ? "s" : ""}` },
          ].map((item) => (
            <div key={item.label} className="bg-bg-surface-1 border border-b-subtle rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5">
                <item.icon className="h-3.5 w-3.5 text-t-muted" />
                <span className="font-ui text-[var(--text-micro)] uppercase tracking-[0.12em] text-t-muted">
                  {item.label}
                </span>
              </div>
              <p className="font-ui text-[var(--text-body)] text-t-primary font-medium">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Staff technique */}
      {coaches.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="font-display text-[var(--text-h3)] text-t-primary uppercase tracking-wider">
              Staff technique
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {coaches.map((coach) => (
              <CoachCard key={coach.id} coach={coach} />
            ))}
          </div>
        </section>
      )}

      {coaches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="font-ui text-[14px] text-t-secondary">Aucun staff enregistré</p>
        </div>
      )}
    </div>
  );
}
