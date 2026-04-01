import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  MOCK_FUT_COMPOSITIONS, MOCK_CONVOCATION_PLAYERS, MOCK_CONVOCATION_MATCHES,
  type SelectionStatus,
} from "@/data/mockCommunication";
import { FORMATIONS } from "@/components/composition/formations";

interface Props {
  matchId: string;
  selections: Record<string, SelectionStatus>;
  onImportComposition: (selections: Record<string, SelectionStatus>, compositionId: string) => void;
  wasModified: boolean;
}

/** Position line grouping for the visual layout */
const LINE_ORDER: Record<string, number> = {
  GK: 0, RB: 1, CB: 1, LB: 1, LWB: 1, RWB: 1,
  CDM: 2, CM: 2, CAM: 2, RM: 2, LM: 2, RAM: 2, LAM: 2,
  RW: 3, LW: 3, ST: 3, CF: 3, SS: 3,
};

function generateCompositionImage(compositionId: string, matchId: string): HTMLCanvasElement | null {
  const comp = MOCK_FUT_COMPOSITIONS.find((c) => c.id === compositionId);
  const match = MOCK_CONVOCATION_MATCHES.find((m) => m.id === matchId);
  if (!comp || !match) return null;

  const formation = FORMATIONS[comp.formation];
  if (!formation) return null;

  const playerMap = new Map(MOCK_CONVOCATION_PLAYERS.map((p) => [p.id, p]));

  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient (dark green pitch feel)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#0a1a12");
  bgGrad.addColorStop(0.5, "#0d2818");
  bgGrad.addColorStop(1, "#0a1a12");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Pitch area
  const pitchX = 60;
  const pitchY = 220;
  const pitchW = W - 120;
  const pitchH = H - 380;

  // Pitch outline
  ctx.strokeStyle = "rgba(22, 255, 110, 0.15)";
  ctx.lineWidth = 2;
  ctx.strokeRect(pitchX, pitchY, pitchW, pitchH);

  // Center line
  ctx.beginPath();
  ctx.moveTo(pitchX, pitchY + pitchH / 2);
  ctx.lineTo(pitchX + pitchW, pitchY + pitchH / 2);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(W / 2, pitchY + pitchH / 2, 80, 0, Math.PI * 2);
  ctx.stroke();

  // Penalty areas
  const penW = 260;
  const penH = 120;
  // Top
  ctx.strokeRect(W / 2 - penW / 2, pitchY, penW, penH);
  // Bottom
  ctx.strokeRect(W / 2 - penW / 2, pitchY + pitchH - penH, penW, penH);

  // Header — Club name
  ctx.fillStyle = "#16FF6E";
  ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("RFC XHOFFRAIX", W / 2, 50);

  // Match info
  ctx.fillStyle = "#E0F0E6";
  ctx.font = "20px system-ui, -apple-system, sans-serif";
  const matchLabel = match.is_home
    ? `RFC Xhoffraix vs ${match.opponent}`
    : `${match.opponent} vs RFC Xhoffraix`;
  ctx.fillText(matchLabel, W / 2, 85);

  // Date
  const d = new Date(match.date);
  const dateStr = d.toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });
  const timeStr = `${d.getHours()}h${String(d.getMinutes()).padStart(2, "0")}`;
  ctx.fillStyle = "#8BA89B";
  ctx.font = "16px system-ui, -apple-system, sans-serif";
  ctx.fillText(`${dateStr} — ${timeStr}`, W / 2, 115);

  // Formation label
  ctx.fillStyle = "#16FF6E";
  ctx.font = "bold 36px system-ui, -apple-system, sans-serif";
  ctx.fillText(comp.formation, W / 2, 170);

  // Draw players on pitch positions
  formation.positions.forEach((pos, i) => {
    const starter = comp.starters[i];
    if (!starter) return;
    const player = playerMap.get(starter.player_id);
    if (!player) return;

    const cx = pitchX + (pos.x / 100) * pitchW;
    // Invert Y: formation y=92 is bottom (GK), y=18 is top (ST)
    const cy = pitchY + (pos.y / 100) * pitchH;

    // Player circle
    const radius = 28;
    const circGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    circGrad.addColorStop(0, "#16FF6E");
    circGrad.addColorStop(1, "#0E9B44");
    ctx.fillStyle = circGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Jersey number
    ctx.fillStyle = "#0a1a12";
    ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(player.jersey_number), cx, cy);

    // Player name below
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText(`${player.first_name[0]}. ${player.last_name}`, cx, cy + radius + 4);

    // Position label
    ctx.fillStyle = "#8BA89B";
    ctx.font = "10px system-ui, -apple-system, sans-serif";
    ctx.fillText(pos.label, cx, cy + radius + 22);
  });

  // Substitutes section at bottom
  const subsY = pitchY + pitchH + 30;
  ctx.fillStyle = "#8BA89B";
  ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("REMPLAÇANTS", W / 2, subsY);

  const subPlayers = comp.substitutes.map((id) => playerMap.get(id)).filter(Boolean);
  const subSpacing = Math.min(160, (pitchW - 40) / Math.max(subPlayers.length, 1));
  const subStartX = W / 2 - ((subPlayers.length - 1) * subSpacing) / 2;

  subPlayers.forEach((player, i) => {
    if (!player) return;
    const sx = subStartX + i * subSpacing;
    const sy = subsY + 35;

    // Small circle
    ctx.fillStyle = "rgba(22, 255, 110, 0.2)";
    ctx.beginPath();
    ctx.arc(sx, sy, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#16FF6E";
    ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(player.jersey_number), sx, sy);

    ctx.fillStyle = "#E0F0E6";
    ctx.font = "11px system-ui, -apple-system, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText(`${player.first_name[0]}. ${player.last_name}`, sx, sy + 26);
  });

  // Watermark
  ctx.fillStyle = "rgba(139, 168, 155, 0.3)";
  ctx.font = "12px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("Généré par Tactik Coach", W / 2, H - 15);

  return canvas;
}

export default function FUTCompositionLink({
  matchId, selections, onImportComposition, wasModified,
}: Props) {
  const [enabled, setEnabled] = useState(false);
  const [selectedCompId, setSelectedCompId] = useState<string>("");

  const available = useMemo(
    () => MOCK_FUT_COMPOSITIONS.filter((c) => c.match_id === matchId),
    [matchId],
  );

  useEffect(() => {
    setEnabled(false);
    setSelectedCompId("");
  }, [matchId]);

  const handleToggle = (on: boolean) => {
    setEnabled(on);
    if (!on) setSelectedCompId("");
  };

  const handleSelect = (compId: string) => {
    setSelectedCompId(compId);
    const comp = MOCK_FUT_COMPOSITIONS.find((c) => c.id === compId);
    if (!comp) return;

    const newSelections: Record<string, SelectionStatus> = {};
    comp.starters.forEach((s) => { newSelections[s.player_id] = "starter"; });
    comp.substitutes.forEach((id) => { newSelections[id] = "sub"; });
    onImportComposition(newSelections, compId);
  };

  const handleDownload = useCallback(() => {
    const canvas = generateCompositionImage(selectedCompId, matchId);
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const match = MOCK_CONVOCATION_MATCHES.find((m) => m.id === matchId);
      a.download = `composition-${match?.opponent.replace(/\s+/g, "-").toLowerCase() ?? "match"}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Composition téléchargée !");
    }, "image/jpeg", 0.95);
  }, [selectedCompId, matchId]);

  if (!matchId) return null;

  return (
    <div className="space-y-3">
      <p className="font-ui text-[11px] text-t-muted uppercase tracking-wider">
        Composition FUT
      </p>

      <div className="flex items-center gap-3">
        <Switch checked={enabled} onCheckedChange={handleToggle} />
        <span className="font-ui text-[13px] text-t-secondary">
          Utiliser une composition FUT
        </span>
        {selectedCompId && (
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

      {enabled && (
        <>
          {available.length > 0 ? (
            <Select value={selectedCompId} onValueChange={handleSelect}>
              <SelectTrigger className="bg-bg-surface-2 border-b-subtle font-ui text-[13px] text-t-primary max-w-md">
                <SelectValue placeholder="Sélectionner une composition" />
              </SelectTrigger>
              <SelectContent className="bg-bg-surface-1 border-b-subtle">
                {available.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="font-ui text-[13px]">
                    Composition — {c.formation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="bg-bg-surface-2 border border-b-subtle rounded-xl p-4">
              <p className="font-ui text-[13px] text-t-muted">
                Aucune composition créée pour ce match.{" "}
                <Link to="/composition" className="text-primary hover:underline">
                  Créer une composition →
                </Link>
              </p>
            </div>
          )}

          {selectedCompId && (
            <Button
              onClick={handleDownload}
              className="bg-bg-surface-2 border border-b-subtle text-t-primary font-ui hover:bg-bg-surface-3 flex items-center gap-2"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              Télécharger la composition (JPEG)
            </Button>
          )}
        </>
      )}
    </div>
  );
}
