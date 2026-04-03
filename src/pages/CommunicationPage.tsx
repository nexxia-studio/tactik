import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Copy, ExternalLink, Check, Users, Send } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MOCK_PAST_CONVOCATIONS, type SelectionStatus } from "@/data/mockCommunication";
import FUTCompositionLink from "@/components/communication/FUTCompositionLink";
import { useActiveTeam } from "@/contexts/TeamContext";
import { usePlayers } from "@/hooks/usePlayers";
import { useMatchesByOrg, type Match } from "@/hooks/useMatches";
import { useActiveUnavailabilities } from "@/hooks/usePlayerUnavailabilities";

const MATCH_TYPE_LABELS: Record<string, string> = {
  championship: "Championnat",
  friendly:     "Amical",
  cup:          "Coupe",
};

function formatMatchDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" }).replace(/^\w/, (c) => c.toUpperCase());
}

function formatMatchTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours()}h${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-BE", { day: "numeric", month: "short", year: "numeric" });
}

function matchSelectLabel(m: Match) {
  const homeAway = m.is_home ? "vs" : "@";
  const type = MATCH_TYPE_LABELS[m.type] ?? m.type;
  const date = new Date(m.match_date).toLocaleDateString("fr-BE", { day: "numeric", month: "short" });
  return `${date} — ${homeAway} ${m.opponent} · ${type}`;
}

export default function CommunicationPage() {
  const [searchParams] = useSearchParams();
  const { activeTeamId: teamId, activeTeam } = useActiveTeam();
  const { data: teamPlayers = [] } = usePlayers(teamId);
  const { data: allMatches = [] } = useMatchesByOrg(activeTeam?.organization_id);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const { data: activeUnavailabilities = [] } = useActiveUnavailabilities(teamId, today);
  const unavailableIds = useMemo(
    () => new Set(activeUnavailabilities.map((u) => u.player_id)),
    [activeUnavailabilities]
  );

  // Shape real players for convocation
  const convocationPlayers = useMemo(() => {
    return teamPlayers
      .map((p) => {
        const parts = p.full_name.trim().split(/\s+/);
        const last_name = parts.length > 1 ? parts[parts.length - 1] : p.full_name;
        const first_name = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
        return {
          id: p.id,
          first_name,
          last_name,
          jersey_number: p.shirt_number ?? 0,
          position: p.position_preferred ?? "",
          isUnavailable: unavailableIds.has(p.id),
        };
      })
      .sort((a, b) => {
        // Unavailable always last
        if (a.isUnavailable !== b.isUnavailable) return a.isUnavailable ? 1 : -1;
        // Within group: shirt_number ASC, null last
        if (a.jersey_number === 0 && b.jersey_number === 0) return 0;
        if (a.jersey_number === 0) return 1;
        if (b.jersey_number === 0) return -1;
        return a.jersey_number - b.jersey_number;
      });
  }, [teamPlayers, unavailableIds]);

  // Future matches sorted ASC
  const futureMatches = useMemo(() => {
    const now = new Date().toISOString();
    return allMatches
      .filter((m) => m.match_date > now && m.status !== "cancelled")
      .sort((a, b) => a.match_date.localeCompare(b.match_date));
  }, [allMatches]);

  const [matchId, setMatchId] = useState<string>("");
  const [selections, setSelections] = useState<Record<string, SelectionStatus>>({});
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [importedCompId, setImportedCompId] = useState<string>("");
  const [importedSnapshot, setImportedSnapshot] = useState<string>("");

  // Auto-select next match
  const autoSelectedRef = useRef(false);
  useEffect(() => {
    if (autoSelectedRef.current || matchId || futureMatches.length === 0) return;
    setMatchId(futureMatches[0].id);
    autoSelectedRef.current = true;
  }, [futureMatches, matchId]);

  // Auto-select match from query params (from Composition page)
  useEffect(() => {
    const opponent = searchParams.get("opponent");
    if (opponent && !matchId) {
      const found = futureMatches.find((m) => m.opponent === opponent);
      if (found) setMatchId(found.id);
    }
  }, [searchParams, futureMatches, matchId]);

  const match = futureMatches.find((m) => m.id === matchId);

  const starters = useMemo(
    () => convocationPlayers.filter((p) => selections[p.id] === "starter"),
    [convocationPlayers, selections]
  );
  const subs = useMemo(
    () => convocationPlayers.filter((p) => selections[p.id] === "sub"),
    [convocationPlayers, selections]
  );
  const notSelected = useMemo(
    () => convocationPlayers.filter((p) => !selections[p.id]),
    [convocationPlayers, selections]
  );

  const wasModified = useMemo(() => {
    if (!importedCompId || !importedSnapshot) return false;
    return JSON.stringify(selections) !== importedSnapshot;
  }, [selections, importedCompId, importedSnapshot]);

  const handleImportComposition = (newSelections: Record<string, SelectionStatus>, compId: string) => {
    setSelections(newSelections);
    setImportedCompId(compId);
    setImportedSnapshot(JSON.stringify(newSelections));
  };

  const togglePlayer = (id: string) => {
    setSelections((prev) => {
      const current = prev[id];
      if (!current) return { ...prev, [id]: "starter" };
      if (current === "starter") return { ...prev, [id]: "sub" };
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const selectAll = () => {
    const newSel: Record<string, SelectionStatus> = {};
    convocationPlayers.forEach((p, i) => {
      newSel[p.id] = i < 11 ? "starter" : "sub";
    });
    setSelections(newSel);
  };

  const deselectAll = () => setSelections({});

  // Build WhatsApp message
  const clubName = activeTeam?.name?.toUpperCase() ?? "MON ÉQUIPE";
  const whatsappText = useMemo(() => {
    if (!match) return "";
    const lines: string[] = [];
    lines.push(`🟢 CONVOCATION — ${clubName}`);
    lines.push("");
    lines.push(`📅 ${formatMatchDate(match.match_date)} — ${formatMatchTime(match.match_date)}`);
    lines.push(`🆚 vs ${match.opponent}`);
    if (match.location) lines.push(`📍 ${match.location}`);
    lines.push("");

    if (starters.length > 0) {
      lines.push(`✅ TITULAIRES (${starters.length}) :`);
      starters.forEach((p, i) => {
        lines.push(`${i + 1}. ${p.first_name[0]}. ${p.last_name}${p.position ? ` (${p.position})` : ""}`);
      });
      lines.push("");
    }

    if (subs.length > 0) {
      lines.push(`🔄 REMPLAÇANTS (${subs.length}) :`);
      subs.forEach((p, i) => {
        lines.push(`${starters.length + i + 1}. ${p.first_name[0]}. ${p.last_name}${p.position ? ` (${p.position})` : ""}`);
      });
      lines.push("");
    }

    if (message.trim()) {
      lines.push(`💬 "${message.trim()}"`);
      lines.push("");
    }

    lines.push("⚠️ Confirmer ta présence avant vendredi 18h00");
    return lines.join("\n");
  }, [match, starters, subs, message, clubName]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(whatsappText);
    setCopied(true);
    toast.success("Message copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="min-w-0">
        <h1 className="font-display text-t-primary leading-none truncate" style={{ fontSize: "clamp(20px, 5vw, 40px)" }}>
          COMMUNICATION
        </h1>
        <p className="text-t-muted font-ui text-[var(--text-small)] mt-2 italic truncate">
          Convocations & messages équipe
        </p>
      </div>

      {/* Section 1 — Composer */}
      <section className="bg-bg-surface-1 border border-b-subtle rounded-xl p-5 space-y-6">

        {/* Step 1 — Match info */}
        <div className="space-y-3">
          <p className="font-ui text-[11px] text-t-muted uppercase tracking-wider">Étape 1 — Match</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-ui text-[12px] text-t-secondary">Match</label>
              <Select value={matchId} onValueChange={setMatchId}>
                <SelectTrigger className="bg-bg-surface-2 border-b-subtle font-ui text-[13px] text-t-primary">
                  <SelectValue placeholder="Sélectionner un match" />
                </SelectTrigger>
                <SelectContent className="bg-bg-surface-1 border-b-subtle">
                  {futureMatches.length === 0 && (
                    <SelectItem value="__none" disabled className="font-ui text-[13px] text-t-muted">
                      Aucun match à venir
                    </SelectItem>
                  )}
                  {futureMatches.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="font-ui text-[13px]">
                      {matchSelectLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {match && (
              <>
                <div className="space-y-1.5">
                  <label className="font-ui text-[12px] text-t-secondary">Date & heure</label>
                  <p className="font-ui text-[14px] text-t-primary py-2">
                    {formatMatchDate(match.match_date)} — {formatMatchTime(match.match_date)}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="font-ui text-[12px] text-t-secondary">Lieu</label>
                  <p className="font-ui text-[14px] text-t-primary py-2 italic">
                    {match.location ?? (match.is_home ? "Domicile" : "Extérieur")}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Step 1b — FUT Composition link */}
        <FUTCompositionLink
          matchId={matchId}
          selections={selections}
          onImportComposition={handleImportComposition}
          wasModified={wasModified}
        />

        {/* Step 2 — Player selection */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="font-ui text-[11px] text-t-muted uppercase tracking-wider">Étape 2 — Sélection</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="font-ui text-[11px] sm:text-[12px] text-t-secondary">
                {starters.length} titulaires / {subs.length} remplaçants / {notSelected.length} non convoqués
              </span>
              <button onClick={selectAll} className="font-ui text-[11px] text-primary hover:underline cursor-pointer">Tout sélectionner</button>
              <button onClick={deselectAll} className="font-ui text-[11px] text-t-muted hover:text-t-secondary cursor-pointer">Tout désélectionner</button>
            </div>
          </div>

          {convocationPlayers.length === 0 ? (
            <div className="py-8 text-center">
              <p className="font-ui text-[13px] text-t-muted">Aucun joueur dans l'équipe active.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {convocationPlayers.map((player) => {
                const status = selections[player.id];
                const isSelected = !!status;
                return (
                  <button
                    key={player.id}
                    onClick={() => togglePlayer(player.id)}
                    className={`relative p-3 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-[var(--color-primary-dim)] border border-[var(--color-primary-border)]"
                        : "bg-bg-surface-2 border border-b-subtle hover:border-[var(--border-default)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-[var(--color-primary-glow)]" : "bg-bg-surface-1"
                      }`}>
                        <span className="font-display text-[11px] text-t-primary">
                          {player.jersey_number > 0 ? player.jersey_number : "—"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-ui text-[13px] text-t-primary truncate">
                          {player.first_name} {player.last_name}
                        </p>
                        <p className="font-ui text-[10px] text-t-muted uppercase tracking-wider">
                          {player.position || "—"}
                        </p>
                      </div>
                    </div>
                    {/* Selection badge */}
                    {status && (
                      <span
                        className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded font-ui text-[9px] uppercase tracking-wider"
                        style={{
                          backgroundColor: status === "starter" ? "rgba(22,255,110,0.2)" : "rgba(79,142,255,0.2)",
                          color: status === "starter" ? "var(--color-primary)" : "var(--color-info)",
                        }}
                      >
                        {status === "starter" ? "Titulaire" : "Remplaçant"}
                      </span>
                    )}
                    {/* Unavailability badge */}
                    {player.isUnavailable && !status && (
                      <span
                        className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded font-ui text-[9px] uppercase tracking-wider"
                        style={{ backgroundColor: "rgba(255,59,48,0.15)", color: "var(--color-danger)" }}
                      >
                        Indisponible
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 3 — Message */}
        <div className="space-y-3">
          <p className="font-ui text-[11px] text-t-muted uppercase tracking-wider">Étape 3 — Message du coach</p>
          <div className="relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 300))}
              placeholder="Consignes spéciales, heure de rendez-vous, tenue..."
              className="bg-bg-surface-2 border-b-subtle text-t-primary font-ui text-[14px] min-h-[80px]"
              maxLength={300}
            />
            <span className="absolute bottom-2 right-3 font-ui text-[10px] text-t-muted">
              {message.length}/300
            </span>
          </div>
        </div>

        {/* Step 4 — Preview */}
        {match && (starters.length > 0 || subs.length > 0) && (
          <div className="space-y-3">
            <p className="font-ui text-[11px] text-t-muted uppercase tracking-wider">Étape 4 — Prévisualisation</p>
            <div className="bg-[#0B3D2E] border border-[#1A5C40] rounded-xl p-4 font-ui text-[13px] text-[#E0F0E6] whitespace-pre-wrap leading-relaxed">
              {whatsappText}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleCopy}
                className="bg-primary text-primary-text font-ui hover:opacity-90 flex items-center gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copié !" : "Copier le message"}
              </Button>
              <Button
                onClick={handleWhatsApp}
                className="font-ui hover:opacity-90 flex items-center gap-2 text-white"
                style={{ backgroundColor: "#25D366" }}
              >
                <ExternalLink className="h-4 w-4" />
                Ouvrir WhatsApp
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Section 2 — Historique */}
      <section className="space-y-3">
        <h2 className="font-ui text-[11px] text-t-muted uppercase tracking-wider px-1">Historique</h2>
        <div className="space-y-2">
          {MOCK_PAST_CONVOCATIONS.map((conv) => (
            <div key={conv.id} className="bg-bg-surface-1 border border-b-subtle rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-display text-[14px] text-t-primary uppercase">{conv.match}</p>
                <p className="font-ui text-[11px] text-t-muted italic">{formatDate(conv.date)}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Users className="h-3 w-3 text-t-muted" />
                <span className="font-ui text-[12px] text-t-secondary">{conv.players_count} joueurs</span>
              </div>
              <span
                className="px-2.5 py-1 rounded-md font-ui text-[10px] uppercase tracking-wider shrink-0"
                style={{
                  backgroundColor: conv.status === "sent" ? "rgba(22,255,110,0.15)" : "rgba(255,255,255,0.05)",
                  color: conv.status === "sent" ? "var(--color-primary)" : "var(--text-muted)",
                }}
              >
                {conv.status === "sent" ? "Envoyé" : "Brouillon"}
              </span>
              <button className="w-8 h-8 rounded-lg bg-bg-surface-2 border border-b-subtle flex items-center justify-center hover:bg-bg-surface-3 transition-all cursor-pointer shrink-0">
                <Send className="h-3.5 w-3.5 text-t-muted" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
