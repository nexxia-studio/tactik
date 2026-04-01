import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Search, Youtube, Clock, BookOpen, PenLine } from "lucide-react";
import type { Drill, DrillSource, PhaseType } from "@/data/mockTrainings";
import { PHASE_META } from "@/data/mockTrainings";

/* ── Drill library (mock) ── */
const DRILL_LIBRARY: (Drill & { category: PhaseType })[] = [
  // Échauffement
  { id: "lib-1",  name: "Toros 4v2",               duration: 8,  source: "manual",  category: "warmup" },
  { id: "lib-2",  name: "Toros 5v2",               duration: 8,  source: "manual",  category: "warmup" },
  { id: "lib-3",  name: "Passes courtes en triangle", duration: 7,  source: "youtube", source_url: "https://youtube.com", category: "warmup" },
  { id: "lib-4",  name: "Mobilité articulaire",    duration: 7,  source: "manual",  category: "warmup" },
  { id: "lib-5",  name: "Activation dynamique",    duration: 10, source: "manual",  category: "warmup" },
  { id: "lib-6",  name: "Jeu des 10 passes",       duration: 12, source: "manual",  category: "warmup" },
  { id: "lib-7",  name: "Circuit coordination",    duration: 10, source: "tiktok",  source_url: "https://tiktok.com", category: "warmup" },
  // Tactique
  { id: "lib-8",  name: "Bloc défensif bas",       duration: 15, source: "manual",  category: "tactical" },
  { id: "lib-9",  name: "Pressing haut",           duration: 10, source: "youtube", source_url: "https://youtube.com", category: "tactical" },
  { id: "lib-10", name: "Transitions off→def",     duration: 20, source: "youtube", source_url: "https://youtube.com", category: "tactical" },
  { id: "lib-11", name: "Sorties de balle",        duration: 15, source: "manual",  category: "tactical" },
  { id: "lib-12", name: "Possession 6v4+2",        duration: 15, source: "youtube", source_url: "https://youtube.com", category: "tactical" },
  { id: "lib-13", name: "Corners offensifs",        duration: 10, source: "manual",  category: "tactical" },
  { id: "lib-14", name: "Coups francs directs",     duration: 10, source: "manual",  category: "tactical" },
  // Technique
  { id: "lib-15", name: "Centres + finitions",     duration: 15, source: "tiktok",  source_url: "https://tiktok.com", category: "technical" },
  { id: "lib-16", name: "Contrôle orienté",        duration: 10, source: "manual",  category: "technical" },
  { id: "lib-17", name: "Une-deux + frappe",       duration: 10, source: "tiktok",  source_url: "https://tiktok.com", category: "technical" },
  { id: "lib-18", name: "Jeu en profondeur",       duration: 15, source: "manual",  category: "technical" },
  { id: "lib-19", name: "Duels 1v1 latéraux",      duration: 12, source: "tiktok",  source_url: "https://tiktok.com", category: "technical" },
  { id: "lib-20", name: "Frappes enchaînées",      duration: 12, source: "manual",  category: "technical" },
  { id: "lib-21", name: "Jonglerie technique",     duration: 8,  source: "youtube", source_url: "https://youtube.com", category: "technical" },
  // Match
  { id: "lib-22", name: "Match 8v8",               duration: 25, source: "manual",  category: "scrimmage" },
  { id: "lib-23", name: "Match 9v9",               duration: 25, source: "manual",  category: "scrimmage" },
  { id: "lib-24", name: "Match 10v10",             duration: 30, source: "manual",  category: "scrimmage" },
  { id: "lib-25", name: "Match réduit 5v5",        duration: 15, source: "manual",  category: "scrimmage" },
  { id: "lib-26", name: "Match à thème",           duration: 20, source: "manual",  category: "scrimmage" },
];

const SOURCE_FILTERS: { value: DrillSource | "all"; label: string; icon?: React.ReactNode }[] = [
  { value: "all",     label: "Tous" },
  { value: "manual",  label: "Manuel",  icon: <span className="text-[10px]">📋</span> },
  { value: "youtube", label: "YouTube", icon: <Youtube className="h-3 w-3 text-[#FF0000]" /> },
  { value: "tiktok",  label: "TikTok",  icon: <span className="text-[10px]">🎵</span> },
];

interface AddDrillDialogProps {
  phaseType: PhaseType;
  existingDrillIds: string[];
  onAdd: (drill: Drill) => void;
}

export default function AddDrillDialog({ phaseType, existingDrillIds, onAdd }: AddDrillDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<DrillSource | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<PhaseType | "all">(phaseType);

  const [tab, setTab] = useState<"library" | "create">("library");
  const [customName, setCustomName] = useState("");
  const [customDuration, setCustomDuration] = useState("10");
  const [customSource, setCustomSource] = useState<DrillSource>("manual");
  const [customUrl, setCustomUrl] = useState("");

  const filtered = useMemo(() => {
    return DRILL_LIBRARY.filter((d) => {
      if (categoryFilter !== "all" && d.category !== categoryFilter) return false;
      if (sourceFilter !== "all" && d.source !== sourceFilter) return false;
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, sourceFilter, categoryFilter]);

  const handleAdd = (drill: typeof DRILL_LIBRARY[number]) => {
    const newDrill: Drill = {
      id: `drill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: drill.name,
      duration: drill.duration,
      source: drill.source,
      source_url: drill.source_url,
    };
    onAdd(newDrill);
    setOpen(false);
    setSearch("");
  };

  const handleCreateCustom = () => {
    if (!customName.trim()) return;
    const newDrill: Drill = {
      id: `drill-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: customName.trim(),
      duration: parseInt(customDuration) || 10,
      source: customSource,
      source_url: customSource !== "manual" && customUrl.trim() ? customUrl.trim() : undefined,
    };
    onAdd(newDrill);
    setOpen(false);
    setCustomName("");
    setCustomDuration("10");
    setCustomSource("manual");
    setCustomUrl("");
  };

  function getSourceIcon(source: DrillSource) {
    switch (source) {
      case "youtube": return <Youtube className="h-3 w-3 text-[#FF0000]" />;
      case "tiktok":  return <span className="text-[10px]">🎵</span>;
      default:        return <span className="text-[10px]">📋</span>;
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 font-ui text-[12px] text-t-muted hover:text-primary transition-colors cursor-pointer py-1">
          <Plus className="h-3 w-3" />
          Ajouter un exercice
        </button>
      </DialogTrigger>
      <DialogContent className="bg-bg-surface-1 border-b-subtle max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-t-primary uppercase text-[16px]">
            Ajouter un exercice
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1.5">
          {([
            { key: "library" as const, label: "Bibliothèque", icon: BookOpen },
            { key: "create" as const, label: "Créer", icon: PenLine },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg font-ui text-[12px] transition-all cursor-pointer flex items-center gap-1.5 ${
                tab === t.key
                  ? "bg-primary text-primary-text"
                  : "bg-bg-surface-2 text-t-secondary border border-b-subtle hover:bg-bg-surface-2/80"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "library" ? (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-t-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un exercice..."
                className="pl-9 bg-bg-surface-2 border-b-subtle font-ui text-[13px] text-t-primary"
              />
            </div>

            {/* Filters row */}
            <div className="space-y-2">
              <div className="flex gap-1.5 flex-wrap">
                {SOURCE_FILTERS.map((sf) => (
                  <button
                    key={sf.value}
                    onClick={() => setSourceFilter(sf.value)}
                    className={`px-2.5 py-1 rounded-lg font-ui text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                      sourceFilter === sf.value
                        ? "bg-primary text-primary-text"
                        : "bg-bg-surface-2 text-t-secondary border border-b-subtle hover:bg-bg-surface-2/80"
                    }`}
                  >
                    {sf.icon}
                    {sf.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={`px-2.5 py-1 rounded-lg font-ui text-[11px] transition-all cursor-pointer ${
                    categoryFilter === "all"
                      ? "bg-primary text-primary-text"
                      : "bg-bg-surface-2 text-t-secondary border border-b-subtle hover:bg-bg-surface-2/80"
                  }`}
                >
                  Toutes phases
                </button>
                {(["warmup", "tactical", "technical", "scrimmage"] as PhaseType[]).map((pt) => (
                  <button
                    key={pt}
                    onClick={() => setCategoryFilter(pt)}
                    className={`px-2.5 py-1 rounded-lg font-ui text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                      categoryFilter === pt
                        ? "bg-primary text-primary-text"
                        : "bg-bg-surface-2 text-t-secondary border border-b-subtle hover:bg-bg-surface-2/80"
                    }`}
                  >
                    <span className="text-[10px]">{PHASE_META[pt].icon}</span>
                    {PHASE_META[pt].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0 -mx-1 px-1">
              {filtered.length === 0 ? (
                <p className="font-ui text-[12px] text-t-muted text-center py-8 italic">
                  Aucun exercice trouvé
                </p>
              ) : (
                filtered.map((drill) => (
                  <button
                    key={drill.id}
                    onClick={() => handleAdd(drill)}
                    className="w-full flex items-center gap-3 bg-bg-surface-2 hover:bg-bg-surface-2/80 rounded-lg px-3 py-2.5 transition-all cursor-pointer text-left group"
                  >
                    <span className="text-[12px]">{PHASE_META[drill.category].icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-ui text-[13px] text-t-primary truncate">{drill.name}</p>
                      <p className="font-ui text-[11px] text-t-muted">{PHASE_META[drill.category].label}</p>
                    </div>
                    <span className="font-ui text-[11px] text-t-muted flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {drill.duration}'
                    </span>
                    {getSourceIcon(drill.source)}
                    <Plus className="h-3.5 w-3.5 text-t-muted group-hover:text-primary transition-colors shrink-0" />
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          /* Create custom drill form */
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-ui text-[12px] text-t-secondary">Nom de l'exercice *</Label>
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ex: Passes longues diagonales"
                className="bg-bg-surface-2 border-b-subtle font-ui text-[13px] text-t-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-ui text-[12px] text-t-secondary">Durée (minutes)</Label>
              <Input
                type="number"
                min="1"
                max="90"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                className="bg-bg-surface-2 border-b-subtle font-ui text-[13px] text-t-primary w-24"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-ui text-[12px] text-t-secondary">Source</Label>
              <div className="flex gap-1.5">
                {([
                  { value: "manual" as DrillSource, label: "Manuel", icon: <span className="text-[10px]">📋</span> },
                  { value: "youtube" as DrillSource, label: "YouTube", icon: <Youtube className="h-3 w-3 text-[#FF0000]" /> },
                  { value: "tiktok" as DrillSource, label: "TikTok", icon: <span className="text-[10px]">🎵</span> },
                ]).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setCustomSource(s.value)}
                    className={`px-3 py-1.5 rounded-lg font-ui text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                      customSource === s.value
                        ? "bg-primary text-primary-text"
                        : "bg-bg-surface-2 text-t-secondary border border-b-subtle hover:bg-bg-surface-2/80"
                    }`}
                  >
                    {s.icon}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {customSource !== "manual" && (
              <div className="space-y-1.5">
                <Label className="font-ui text-[12px] text-t-secondary">
                  URL {customSource === "youtube" ? "YouTube" : "TikTok"}
                </Label>
                <Input
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder={customSource === "youtube" ? "https://youtube.com/watch?v=..." : "https://tiktok.com/@.../video/..."}
                  className="bg-bg-surface-2 border-b-subtle font-ui text-[13px] text-t-primary"
                />
              </div>
            )}

            <Button
              onClick={handleCreateCustom}
              disabled={!customName.trim()}
              className="w-full bg-primary text-primary-text font-ui hover:opacity-90 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter l'exercice
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
