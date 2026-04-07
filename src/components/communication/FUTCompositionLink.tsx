import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { type SelectionStatus } from "@/data/mockCommunication";
import { useLineup } from "@/hooks/useLineup";

interface Props {
  teamId: string | undefined;
  matchId: string;
  selections: Record<string, SelectionStatus>;
  onImportComposition: (selections: Record<string, SelectionStatus>, compositionId: string) => void;
  wasModified: boolean;
}

export default function FUTCompositionLink({
  teamId, matchId, selections, onImportComposition, wasModified,
}: Props) {
  const [enabled, setEnabled] = useState(false);
  const { data: lineupData, isLoading } = useLineup(teamId, matchId || null);

  // Reset toggle when match changes
  useEffect(() => {
    setEnabled(false);
  }, [matchId]);

  const handleToggle = (on: boolean) => {
    setEnabled(on);
    if (on && lineupData) {
      const newSelections: Record<string, SelectionStatus> = {};
      lineupData.players.forEach((id) => { if (id) newSelections[id] = "starter"; });
      lineupData.substitute_ids.forEach((id) => { newSelections[id] = "sub"; });
      onImportComposition(newSelections, lineupData.id);
    }
  };

  if (!matchId) return null;

  return (
    <div className="space-y-3">
      <p className="font-ui text-[11px] text-t-muted uppercase tracking-wider">Composition FUT</p>

      <div className="flex items-center gap-3">
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={isLoading || (!lineupData && !enabled)}
        />
        <span className="font-ui text-[13px] text-t-secondary">
          Utiliser la composition FUT
        </span>
        {enabled && lineupData && (
          <span
            className="ml-auto px-2.5 py-1 rounded-md font-ui text-[10px] uppercase tracking-wider"
            style={{
              backgroundColor: wasModified ? "rgba(255,170,0,0.15)" : "rgba(22,255,110,0.15)",
              color: wasModified ? "var(--color-warning, #ffaa00)" : "var(--color-primary)",
            }}
          >
            {wasModified ? "Compo FUT modifiée" : "Compo FUT importée"}
          </span>
        )}
      </div>

      {enabled && !isLoading && !lineupData && (
        <div className="bg-bg-surface-2 border border-b-subtle rounded-xl p-4">
          <p className="font-ui text-[13px] text-t-muted">
            Aucune composition créée pour ce match.{" "}
            <Link to="/composition" className="text-primary hover:underline">
              Créer une composition →
            </Link>
          </p>
        </div>
      )}

      {enabled && lineupData && (
        <div className="bg-bg-surface-2 border border-b-subtle rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="font-ui text-[13px] text-t-primary font-semibold">
            {lineupData.formation}
          </span>
          <span className="font-ui text-[11px] text-t-muted">
            {lineupData.players.filter(Boolean).length} titulaires
            {lineupData.substitute_ids.length > 0 && ` · ${lineupData.substitute_ids.length} remplaçants`}
          </span>
        </div>
      )}
    </div>
  );
}
