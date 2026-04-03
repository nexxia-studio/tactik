import { useState, useMemo } from "react";
import { Calendar, MapPin, Clock, Pencil, Trash2 } from "lucide-react";
import AddFriendlyMatchDialog from "@/components/calendar/AddFriendlyMatchDialog";
import EditScoreDialog from "@/components/calendar/EditScoreDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useActiveTeam } from "@/contexts/TeamContext";
import {
  useMatchesByOrg,
  useCreateMatch,
  useUpdateMatchScore,
  useDeleteMatch,
  type Match,
} from "@/hooks/useMatches";
import { useToast } from "@/hooks/use-toast";

type Filter = "all" | "played" | "upcoming";

const resultStyles: Record<string, { bg: string; text: string; label: string }> = {
  W: { bg: "bg-[rgba(22,255,110,0.15)]", text: "text-[var(--color-success)]", label: "V" },
  D: { bg: "bg-[rgba(255,214,10,0.15)]", text: "text-[var(--color-warning)]", label: "N" },
  L: { bg: "bg-[rgba(255,59,48,0.15)]",  text: "text-[var(--color-danger)]",  label: "D" },
};

function getResult(match: Match): "W" | "D" | "L" | null {
  if (match.score_home == null || match.score_away == null) return null;
  const ours = match.is_home ? match.score_home : match.score_away;
  const theirs = match.is_home ? match.score_away : match.score_home;
  if (ours > theirs) return "W";
  if (ours === theirs) return "D";
  return "L";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-BE", { weekday: "short", day: "numeric", month: "short" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
}

export default function CalendarPage() {
  const { toast } = useToast();
  const { activeTeamId: teamId, activeTeam } = useActiveTeam();
  const userTeamName = activeTeam?.name ?? "Nous";

  const { data: matches = [], isLoading } = useMatchesByOrg(activeTeam?.organization_id);
  const createMatch = useCreateMatch(teamId);
  const updateScore = useUpdateMatchScore();
  const deleteMatch = useDeleteMatch();

  const [filter, setFilter] = useState<Filter>("all");
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);

  // Compute journée index (sequential number among championship matches)
  const championshipJournee = useMemo(() => {
    const champ = matches.filter((m) => m.type === "championship").map((m, i) => ({ id: m.id, j: i + 1 }));
    return new Map(champ.map((c) => [c.id, c.j]));
  }, [matches]);

  const filtered = useMemo(() => {
    let list = [...matches];
    if (filter === "played")   list = list.filter((m) => m.score_home !== null);
    if (filter === "upcoming") list = list.filter((m) => m.score_home === null);
    return list;
  }, [matches, filter]);

  const nextMatch = useMemo(() => matches.find((m) => m.score_home === null), [matches]);

  const handleAddFriendly = async (data: { opponent: string; isHome: boolean; date: string; time: string; location: string }) => {
    try {
      await createMatch.mutateAsync({
        opponent: data.opponent,
        is_home: data.isHome,
        match_date: `${data.date}T${data.time}:00`,
        location: data.location || null,
        type: "friendly",
      });
      toast({ title: "Match amical ajouté ✓" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMatchId || !teamId) return;
    try {
      await deleteMatch.mutateAsync({ id: deletingMatchId, teamId });
      toast({ title: "Match supprimé" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setDeletingMatchId(null);
  };

  const handleSaveScore = async (score_home: number, score_away: number) => {
    if (!editingMatch || !teamId) return;
    try {
      await updateScore.mutateAsync({ id: editingMatch.id, teamId, score_home, score_away });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setEditingMatch(null);
  };

  // Can only delete manually-created matches (source = 'manual') or friendly matches
  const canDelete = (m: Match) => m.source === "manual" || m.type === "friendly";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-t-primary leading-none" style={{ fontSize: "var(--text-h1)" }}>
          CALENDRIER
        </h1>
        <p className="text-t-secondary font-ui text-[var(--text-small)] mt-2">
          {activeTeam?.name ?? "Mon équipe"}
        </p>
      </div>

      {/* Next match highlight */}
      {nextMatch && (() => {
        const nmHomeTeam = nextMatch.is_home ? userTeamName : nextMatch.opponent;
        const nmAwayTeam = nextMatch.is_home ? nextMatch.opponent : userTeamName;
        const nmHomeLogo = nextMatch.is_home ? nextMatch.team_logo_url : nextMatch.opponent_logo_url;
        const nmAwayLogo = nextMatch.is_home ? nextMatch.opponent_logo_url : nextMatch.team_logo_url;
        return (
          <div className="bg-bg-surface-1 border border-primary-border rounded-xl p-5 glow-primary animate-fade-in">
            <p className="text-label mb-3">
              PROCHAIN MATCH — {nextMatch.type === "friendly" ? "AMICAL" : nextMatch.type === "cup" ? "COUPE" : `JOURNÉE ${championshipJournee.get(nextMatch.id) ?? "—"}`}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex-1 text-right flex flex-col items-end gap-1.5">
                {nmHomeLogo && <img src={nmHomeLogo} alt={nmHomeTeam} className="h-8 w-8 object-contain" />}
                <p className="font-display text-[18px] leading-tight text-primary">{nmHomeTeam}</p>
              </div>
              <div className="px-6 text-center">
                <p className="font-display text-[24px] text-t-primary">VS</p>
                <div className="flex items-center gap-1.5 mt-1 text-t-muted">
                  <Clock className="h-3 w-3" />
                  <span className="font-ui text-[11px]">{formatDate(nextMatch.match_date)} — {formatTime(nextMatch.match_date)}</span>
                </div>
              </div>
              <div className="flex-1 text-left flex flex-col items-start gap-1.5">
                {nmAwayLogo && <img src={nmAwayLogo} alt={nmAwayTeam} className="h-8 w-8 object-contain" />}
                <p className="font-display text-[18px] leading-tight text-t-primary">{nmAwayTeam}</p>
              </div>
            </div>
            {nextMatch.location && (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-t-muted">
                <MapPin className="h-3 w-3" />
                <span className="font-ui text-[11px]">{nextMatch.location}</span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Filters */}
      <div className="flex gap-1.5 items-center">
        {([
          { key: "all" as Filter, label: "Tous" },
          { key: "played" as Filter, label: "Joués" },
          { key: "upcoming" as Filter, label: "À venir" },
        ]).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg font-ui text-[12px] transition-all cursor-pointer ${
              filter === f.key
                ? "bg-primary text-primary-text"
                : "bg-bg-surface-1 text-t-secondary border border-b-subtle hover:bg-bg-surface-2"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto">
          <AddFriendlyMatchDialog onAdd={handleAddFriendly} />
        </div>
      </div>

      {/* Match list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-bg-surface-1 border border-b-subtle rounded-xl p-4 h-[72px] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="font-ui text-[14px] text-t-secondary">Aucun match</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((match) => {
            const result = getResult(match);
            const played = match.score_home !== null;
            const rs = result ? resultStyles[result] : null;
            const journee = championshipJournee.get(match.id);
            const homeTeam = match.is_home ? userTeamName : match.opponent;
            const awayTeam = match.is_home ? match.opponent : userTeamName;
            const homeLogo = match.is_home ? match.team_logo_url : match.opponent_logo_url;
            const awayLogo = match.is_home ? match.opponent_logo_url : match.team_logo_url;

            return (
              <div
                key={match.id}
                className="bg-bg-surface-1 border border-b-subtle rounded-xl p-4 flex items-center gap-4 hover:border-b-default transition-all animate-fade-in group"
              >
                {/* Type badge */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${match.type === "friendly" ? "bg-[rgba(22,255,110,0.1)] border border-primary-border" : "bg-bg-surface-2"}`}>
                  <span className="font-display text-[12px] text-t-muted">
                    {match.type === "friendly" ? "AM" : match.type === "cup" ? "CUP" : journee ? `J${journee}` : "—"}
                  </span>
                </div>

                {/* Teams & score */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {homeLogo && <img src={homeLogo} alt={homeTeam} className="h-5 w-5 object-contain shrink-0" />}
                    <span className={`font-ui text-[14px] truncate ${match.is_home ? "text-t-primary font-semibold" : "text-t-secondary"}`}>
                      {homeTeam}
                    </span>
                    {played ? (
                      <span className="font-display text-[16px] text-t-primary tracking-wider shrink-0">
                        {match.score_home} - {match.score_away}
                      </span>
                    ) : (
                      <span className="font-ui text-[12px] text-t-muted shrink-0">vs</span>
                    )}
                    {awayLogo && <img src={awayLogo} alt={awayTeam} className="h-5 w-5 object-contain shrink-0" />}
                    <span className={`font-ui text-[14px] truncate ${!match.is_home ? "text-t-primary font-semibold" : "text-t-secondary"}`}>
                      {awayTeam}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-ui text-[11px] text-t-muted">
                      {formatDate(match.match_date)} — {formatTime(match.match_date)}
                    </span>
                    {match.location && (
                      <span className="font-ui text-[11px] text-t-muted flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {match.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {new Date(match.match_date) <= new Date() && (
                    <button
                      onClick={() => setEditingMatch(match)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-surface-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-bg-surface-1 border border-transparent hover:border-b-subtle"
                      title="Encoder le score"
                    >
                      <Pencil className="h-3.5 w-3.5 text-t-muted" />
                    </button>
                  )}

                  {canDelete(match) && (
                    <button
                      onClick={() => setDeletingMatchId(match.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-surface-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-[rgba(255,59,48,0.15)] border border-transparent hover:border-[rgba(255,59,48,0.3)]"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-[var(--color-danger)]" />
                    </button>
                  )}

                  {rs && (
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${rs.bg}`}>
                      <span className={`font-display text-[13px] ${rs.text}`}>{rs.label}</span>
                    </div>
                  )}
                  {!played && (
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-bg-surface-2">
                      <Calendar className="h-4 w-4 text-t-muted" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit score dialog */}
      {editingMatch && (
        <EditScoreDialog
          open={!!editingMatch}
          onOpenChange={(v) => { if (!v) setEditingMatch(null); }}
          home={editingMatch.home_team_name ?? userTeamName}
          away={editingMatch.opponent}
          currentHomeScore={editingMatch.score_home}
          currentAwayScore={editingMatch.score_away}
          onSave={handleSaveScore}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingMatchId} onOpenChange={(v) => { if (!v) setDeletingMatchId(null); }}>
        <AlertDialogContent className="bg-bg-base border-b-subtle">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-t-primary text-[14px]">SUPPRIMER LE MATCH</AlertDialogTitle>
            <AlertDialogDescription className="text-t-secondary font-ui text-[var(--text-small)]">
              Êtes-vous sûr de vouloir supprimer ce match ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-ui bg-bg-surface-1 text-t-secondary border-b-subtle hover:bg-bg-surface-2">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-[var(--color-danger)] text-white font-ui hover:opacity-90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
