import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface CompositionMatch {
  id: string;
  opponent: string;
  date: string;
  is_home: boolean;
  played: boolean;
  type: "championship" | "friendly";
}

export const MOCK_COMPOSITION_MATCHES: CompositionMatch[] = [
  { id: "cm1", opponent: "FC Battice", date: "2025-04-06T15:00:00", is_home: true, played: false, type: "championship" },
  { id: "cm2", opponent: "US Thimister", date: "2025-04-13T15:00:00", is_home: false, played: false, type: "championship" },
  { id: "cm3", opponent: "RFC Stavelot", date: "2025-01-25T15:00:00", is_home: true, played: true, type: "championship" },
  { id: "cm4", opponent: "US Malmedy", date: "2025-01-18T14:30:00", is_home: false, played: true, type: "championship" },
  { id: "cm5", opponent: "FC Eupen B", date: "2025-04-20T14:00:00", is_home: true, played: false, type: "friendly" },
];

interface Props {
  selectedMatchId: string | null;
  onSelect: (matchId: string) => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-BE", { day: "2-digit", month: "2-digit" });
}

export function MatchSelector({ selectedMatchId, onSelect }: Props) {
  const upcoming = MOCK_COMPOSITION_MATCHES.filter((m) => !m.played);
  const past = MOCK_COMPOSITION_MATCHES.filter((m) => m.played);

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
      </SelectContent>
    </Select>
  );
}
