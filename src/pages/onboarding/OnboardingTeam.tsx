import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface PlayerRow {
  first_name: string;
  last_name: string;
  position: string;
}

const POSITIONS = [
  "Gardien",
  "Défenseur",
  "Milieu",
  "Attaquant",
];

const emptyPlayer = (): PlayerRow => ({
  first_name: "",
  last_name: "",
  position: "Milieu",
});

export default function OnboardingTeam() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState<PlayerRow[]>([emptyPlayer(), emptyPlayer(), emptyPlayer()]);
  const [submitting, setSubmitting] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_profiles")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.organization_id) setOrgId(data.organization_id);
      });
  }, [user]);

  const addPlayer = () => setPlayers((prev) => [...prev, emptyPlayer()]);

  const removePlayer = (idx: number) =>
    setPlayers((prev) => prev.filter((_, i) => i !== idx));

  const updatePlayer = (idx: number, field: keyof PlayerRow, value: string) =>
    setPlayers((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !orgId || !teamName.trim()) return;
    setSubmitting(true);

    try {
      // Create team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({ name: teamName.trim(), organization_id: orgId })
        .select("id")
        .single();

      if (teamError) throw teamError;

      // Filter valid players and insert
      const validPlayers = players.filter(
        (p) => p.first_name.trim() && p.last_name.trim()
      );

      if (validPlayers.length > 0) {
        const { error: playersError } = await supabase.from("players").insert(
          validPlayers.map((p) => ({
            team_id: team.id,
            first_name: p.first_name.trim(),
            last_name: p.last_name.trim(),
            position: p.position,
          }))
        );
        if (playersError) throw playersError;
      }

      // Mark onboarding as completed
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      toast({ title: "Bienvenue ! 🎉", description: "Ton équipe est prête." });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg space-y-8">
        {/* Progress */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="h-1 flex-1 rounded-full bg-primary" />
          ))}
        </div>

        <div className="text-center space-y-2">
          <p className="text-label">ÉTAPE 3 / 3</p>
          <h1
            className="font-display text-t-primary leading-none"
            style={{ fontSize: "var(--text-h2)" }}
          >
            TON ÉQUIPE
          </h1>
          <p className="font-ui text-[13px] text-t-secondary">
            Nomme ton équipe et ajoute tes premiers joueurs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team name */}
          <div className="space-y-1.5">
            <label className="font-ui text-[11px] uppercase tracking-[0.15em] text-t-secondary">
              Nom de l'équipe
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              placeholder="Ex: U21A, Seniors A, Vétérans…"
              className="w-full font-ui text-[14px] bg-bg-surface-1 border border-b-default
                         text-t-primary rounded-lg px-3 py-3 outline-none
                         focus:border-primary transition-colors placeholder:text-t-muted"
            />
          </div>

          {/* Players */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-ui text-[11px] uppercase tracking-[0.15em] text-t-secondary">
                Joueurs
              </label>
              <button
                type="button"
                onClick={addPlayer}
                className="flex items-center gap-1 font-ui text-[11px] text-primary hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </button>
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {players.map((player, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-bg-surface-1 border border-b-subtle rounded-lg p-2.5"
                >
                  <input
                    type="text"
                    value={player.first_name}
                    onChange={(e) => updatePlayer(idx, "first_name", e.target.value)}
                    placeholder="Prénom"
                    className="flex-1 min-w-0 font-ui text-[13px] bg-transparent text-t-primary outline-none placeholder:text-t-muted"
                  />
                  <input
                    type="text"
                    value={player.last_name}
                    onChange={(e) => updatePlayer(idx, "last_name", e.target.value)}
                    placeholder="Nom"
                    className="flex-1 min-w-0 font-ui text-[13px] bg-transparent text-t-primary outline-none placeholder:text-t-muted"
                  />
                  <select
                    value={player.position}
                    onChange={(e) => updatePlayer(idx, "position", e.target.value)}
                    className="font-ui text-[12px] bg-bg-surface-2 text-t-secondary rounded px-2 py-1 outline-none border-none cursor-pointer"
                  >
                    {POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                  {players.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePlayer(idx)}
                      className="p-1 text-t-muted hover:text-danger transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !teamName.trim()}
            className="w-full font-ui text-[11px] font-semibold tracking-wider uppercase
                       px-4 py-3 rounded-lg bg-primary text-primary-text
                       hover:opacity-90 active:scale-[0.98] transition-all
                       disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Création…" : "Terminer et accéder à Tactik"}
          </button>
        </form>
      </div>
    </div>
  );
}
