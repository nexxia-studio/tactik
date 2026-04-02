import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface CompositionMatch {
  id: string;
  opponent: string;
  date: string;
  is_home: boolean;
  played: boolean;
  type: "championship" | "friendly" | "cup";
}

interface Props {
  selectedMatchId: string | null;
  onSelect: (matchId: string) => void;
  matches: CompositionMatch[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-BE", { day: "2-digit", month: "2-digit" });
}

export function MatchSelector({ selectedMatchId, onSelect, matches }: Props) {
  const upcoming = matches.filter((m) => !m.played);
  const past = matches.filter((m) => m.played);

  return (
    <Select value={selectedMatchId ?? ""} onValueChange={onSelect}>
      <SelectTrigger className="w-[240px] bg-bg-surface-2 border-b-subtle font-ui text-[var(--text-body)]">
        <SelectValue placeholder="Sélectionner un match" />
      </SelectTrigger>
      <SelectContent className="bg-bg-surface-2 border-b-subtle">
        {upcoming.length > 0 && (
          <SelectGroup>
            <SelectLabel className="font-ui text-t-muted text-[var(--text-label)] uppercase tracking-wider">
              Matchs à venir
            </SelectLabel>
            {upcoming.map((m) => (
              <SelectItem key={m.id} value={m.id} className="font-ui text-[var(--text-body)]">
                {m.is_home ? "vs" : "@"} {m.opponent} ({formatDate(m.date)})
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {past.length > 0 && (
          <SelectGroup>
            <SelectLabel className="font-ui text-t-muted text-[var(--text-label)] uppercase tracking-wider">
              Matchs passés
            </SelectLabel>
            {past.map((m) => (
              <SelectItem key={m.id} value={m.id} className="font-ui text-[var(--text-body)]">
                {m.is_home ? "vs" : "@"} {m.opponent} ({formatDate(m.date)}) — JOUÉ
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {matches.length === 0 && (
          <SelectItem value="" disabled className="font-ui text-t-muted text-[var(--text-body)]">
            Aucun match planifié
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
