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

interface Match {
  id: string;
  journee: number | null;
  date: string;
  time: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  location: string;
  isHome: boolean;
  isFriendly?: boolean;
}

const OUR_TEAM = "Xhoffraix";

const MOCK_MATCHES: Match[] = [
  { id: "1", journee: 1, date: "2025-09-07", time: "15:00", home: "Xhoffraix", away: "FC Eupen B", homeScore: 2, awayScore: 1, location: "Xhoffraix", isHome: true },
  { id: "2", journee: 2, date: "2025-09-14", time: "15:00", home: "RCS Verviers", away: "Xhoffraix", homeScore: 1, awayScore: 1, location: "Verviers", isHome: false },
  { id: "3", journee: 3, date: "2025-09-21", time: "15:00", home: "Xhoffraix", away: "JS Solwaster", homeScore: 3, awayScore: 0, location: "Xhoffraix", isHome: true },
  { id: "4", journee: 4, date: "2025-09-28", time: "15:00", home: "FC Heusy", away: "Xhoffraix", homeScore: 2, awayScore: 0, location: "Heusy", isHome: false },
  { id: "5", journee: 5, date: "2025-10-05", time: "15:00", home: "Xhoffraix", away: "Entente Malmedy", homeScore: 4, awayScore: 2, location: "Xhoffraix", isHome: true },
  { id: "6", journee: 6, date: "2025-10-12", time: "15:00", home: "RC Waimes", away: "Xhoffraix", homeScore: 0, awayScore: 3, location: "Waimes", isHome: false },
  { id: "7", journee: 7, date: "2025-10-19", time: "15:00", home: "Xhoffraix", away: "AS Stavelot", homeScore: 1, awayScore: 2, location: "Xhoffraix", isHome: true },
  { id: "8", journee: 8, date: "2025-10-26", time: "14:30", home: "FC Spa", away: "Xhoffraix", homeScore: 1, awayScore: 3, location: "Spa", isHome: false },
  { id: "9", journee: 9, date: "2025-11-09", time: "14:30", home: "Xhoffraix", away: "Jalhay FC", homeScore: 2, awayScore: 2, location: "Xhoffraix", isHome: true },
  { id: "10", journee: 10, date: "2025-11-16", time: "14:30", home: "US Theux", away: "Xhoffraix", homeScore: 0, awayScore: 1, location: "Theux", isHome: false },
  { id: "11", journee: 11, date: "2025-11-23", time: "14:30", home: "Xhoffraix", away: "FC Trois-Ponts", homeScore: 5, awayScore: 1, location: "Xhoffraix", isHome: true },
  { id: "12", journee: 12, date: "2025-11-30", time: "14:30", home: "Baelen FC", away: "Xhoffraix", homeScore: 2, awayScore: 2, location: "Baelen", isHome: false },
  { id: "13", journee: 13, date: "2026-02-22", time: "15:00", home: "Xhoffraix", away: "Franchimont", homeScore: 3, awayScore: 1, location: "Xhoffraix", isHome: true },
  { id: "14", journee: 14, date: "2026-03-01", time: "15:00", home: "Dison B", away: "Xhoffraix", homeScore: 1, awayScore: 1, location: "Dison", isHome: false },
  { id: "15", journee: 15, date: "2026-03-08", time: "15:00", home: "Xhoffraix", away: "RCS Verviers", homeScore: 2, awayScore: 0, location: "Xhoffraix", isHome: true },
  { id: "16", journee: 16, date: "2026-03-15", time: "15:00", home: "JS Solwaster", away: "Xhoffraix", homeScore: 1, awayScore: 4, location: "Solwaster", isHome: false },
  { id: "17", journee: 17, date: "2026-03-22", time: "15:00", home: "Xhoffraix", away: "FC Heusy", homeScore: 3, awayScore: 1, location: "Xhoffraix", isHome: true },
  { id: "18", journee: 18, date: "2026-04-05", time: "15:00", home: "Entente Malmedy", away: "Xhoffraix", homeScore: null, awayScore: null, location: "Malmedy", isHome: false },
  { id: "19", journee: 19, date: "2026-04-12", time: "15:00", home: "Xhoffraix", away: "RC Waimes", homeScore: null, awayScore: null, location: "Xhoffraix", isHome: true },
  { id: "20", journee: 20, date: "2026-04-19", time: "15:00", home: "AS Stavelot", away: "Xhoffraix", homeScore: null, awayScore: null, location: "Stavelot", isHome: false },
  { id: "21", journee: 21, date: "2026-04-26", time: "15:00", home: "Xhoffraix", away: "FC Spa", homeScore: null, awayScore: null, location: "Xhoffraix", isHome: true },
  { id: "22", journee: 22, date: "2026-05-03", time: "15:00", home: "Jalhay FC", away: "Xhoffraix", homeScore: null, awayScore: null, location: "Jalhay", isHome: false },
];

type Filter = "all" | "played" | "upcoming";

function getResult(match: Match): "W" | "D" | "L" | null {
  if (match.homeScore === null || match.awayScore === null) return null;
  const ourGoals = match.isHome ? match.homeScore : match.awayScore;
  const theirGoals = match.isHome ? match.awayScore : match.homeScore;
  if (ourGoals > theirGoals) return "W";
  if (ourGoals === theirGoals) return "D";
  return "L";
}

const resultStyles: Record<string, { bg: string; text: string; label: string }> = {
  W: { bg: "bg-[rgba(22,255,110,0.15)]", text: "text-[var(--color-success)]", label: "V" },
  D: { bg: "bg-[rgba(255,214,10,0.15)]", text: "text-[var(--color-warning)]", label: "N" },
  L: { bg: "bg-[rgba(255,59,48,0.15)]", text: "text-[var(--color-danger)]", label: "D" },
};

export default function CalendarPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);

  const allSorted = useMemo(() => [...matches].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)), [matches]);

  const filtered = useMemo(() => {
    if (filter === "played") return allSorted.filter((m) => m.homeScore !== null);
    if (filter === "upcoming") return allSorted.filter((m) => m.homeScore === null);
    return allSorted;
  }, [filter, allSorted]);

  const nextMatch = allSorted.find((m) => m.homeScore === null);

  const handleAddFriendly = (data: { opponent: string; isHome: boolean; date: string; time: string; location: string }) => {
    const newMatch: Match = {
      id: `friendly-${Date.now()}`,
      journee: null,
      date: data.date,
      time: data.time,
      home: data.isHome ? OUR_TEAM : data.opponent,
      away: data.isHome ? data.opponent : OUR_TEAM,
      homeScore: null,
      awayScore: null,
      location: data.location,
      isHome: data.isHome,
      isFriendly: true,
    };
    setMatches((prev) => [...prev, newMatch]);
  };

  const handleConfirmDelete = () => {
    if (!deletingMatchId) return;
    setMatches((prev) => prev.filter((m) => m.id !== deletingMatchId));
    setDeletingMatchId(null);
  };

  const handleSaveScore = (homeScore: number, awayScore: number) => {
    if (!editingMatch) return;
    setMatches((prev) =>
      prev.map((m) =>
        m.id === editingMatch.id ? { ...m, homeScore, awayScore } : m
      )
    );
    setEditingMatch(null);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-BE", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-t-primary leading-none" style={{ fontSize: "var(--text-h1)" }}>
          CALENDRIER
        </h1>
        <p className="text-t-secondary font-ui text-[var(--text-small)] mt-2">
          P2C Liège — Saison 2025-2026
        </p>
      </div>

      {/* Next match highlight */}
      {nextMatch && (
        <div className="bg-bg-surface-1 border border-primary-border rounded-xl p-5 glow-primary animate-fade-in">
          <p className="text-label mb-3">
            PROCHAIN MATCH — {nextMatch.isFriendly ? "AMICAL" : `JOURNÉE ${nextMatch.journee}`}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex-1 text-right">
              <p className={`font-display text-[18px] leading-tight ${nextMatch.isHome ? "text-primary" : "text-t-primary"}`}>
                {nextMatch.home}
              </p>
            </div>
            <div className="px-6 text-center">
              <p className="font-display text-[24px] text-t-primary">VS</p>
              <div className="flex items-center gap-1.5 mt-1 text-t-muted">
                <Clock className="h-3 w-3" />
                <span className="font-ui text-[11px]">{formatDate(nextMatch.date)} — {nextMatch.time}</span>
              </div>
            </div>
            <div className="flex-1 text-left">
              <p className={`font-display text-[18px] leading-tight ${!nextMatch.isHome ? "text-primary" : "text-t-primary"}`}>
                {nextMatch.away}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-3 text-t-muted">
            <MapPin className="h-3 w-3" />
            <span className="font-ui text-[11px]">{nextMatch.location}</span>
          </div>
        </div>
      )}

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
      <div className="space-y-2">
        {filtered.map((match) => {
          const result = getResult(match);
          const played = match.homeScore !== null;
          const rs = result ? resultStyles[result] : null;

          return (
            <div
              key={match.id}
              className="bg-bg-surface-1 border border-b-subtle rounded-xl p-4 flex items-center gap-4 hover:border-b-default transition-all animate-fade-in group"
            >
              {/* Journée badge */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${match.isFriendly ? "bg-[rgba(22,255,110,0.1)] border border-primary-border" : "bg-bg-surface-2"}`}>
                <span className="font-display text-[12px] text-t-muted">{match.isFriendly ? "AM" : `J${match.journee}`}</span>
              </div>

              {/* Teams & score */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-ui text-[14px] ${match.home === OUR_TEAM ? "text-t-primary font-semibold" : "text-t-secondary"}`}>
                    {match.home}
                  </span>
                  {played ? (
                    <span className="font-display text-[16px] text-t-primary tracking-wider">
                      {match.homeScore} - {match.awayScore}
                    </span>
                  ) : (
                    <span className="font-ui text-[12px] text-t-muted">vs</span>
                  )}
                  <span className={`font-ui text-[14px] ${match.away === OUR_TEAM ? "text-t-primary font-semibold" : "text-t-secondary"}`}>
                    {match.away}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-ui text-[11px] text-t-muted">{formatDate(match.date)} — {match.time}</span>
                  <span className="font-ui text-[11px] text-t-muted flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {match.location}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Edit score button — only for today or past */}
                {new Date(match.date) <= new Date(new Date().toISOString().split("T")[0]) && (
                  <button
                    onClick={() => setEditingMatch(match)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-surface-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-bg-surface-1 border border-transparent hover:border-b-subtle"
                    title="Encoder le score"
                  >
                    <Pencil className="h-3.5 w-3.5 text-t-muted" />
                  </button>
                )}

                {/* Delete friendly match */}
                {match.isFriendly && (
                  <button
                    onClick={() => setDeletingMatchId(match.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg-surface-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-[rgba(255,59,48,0.15)] border border-transparent hover:border-[rgba(255,59,48,0.3)]"
                    title="Supprimer le match amical"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[var(--color-danger)]" />
                  </button>
                )}

                {/* Result badge */}
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

      {/* Edit score dialog */}
      {editingMatch && (
        <EditScoreDialog
          open={!!editingMatch}
          onOpenChange={(v) => { if (!v) setEditingMatch(null); }}
          home={editingMatch.home}
          away={editingMatch.away}
          currentHomeScore={editingMatch.homeScore}
          currentAwayScore={editingMatch.awayScore}
          onSave={handleSaveScore}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingMatchId} onOpenChange={(v) => { if (!v) setDeletingMatchId(null); }}>
        <AlertDialogContent className="bg-bg-base border-b-subtle">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-t-primary text-[14px]">SUPPRIMER LE MATCH</AlertDialogTitle>
            <AlertDialogDescription className="text-t-secondary font-ui text-[var(--text-small)]">
              Êtes-vous sûr de vouloir supprimer ce match amical ? Cette action est irréversible.
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
