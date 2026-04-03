import { useState, useEffect, useRef } from "react";
import { Camera } from "lucide-react";
import type { Player, PlayerWriteFields } from "@/hooks/usePlayers";
import { uploadPlayerAvatar } from "@/hooks/usePlayers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── Position lists ─────────────────────────────────────────────────────────────

export const POSITIONS = [
  "Gardien",
  "Défenseur central",
  "Arrière droit",
  "Arrière gauche",
  "Milieu défensif",
  "Milieu central",
  "Milieu offensif",
  "Ailier droit",
  "Ailier gauche",
  "Attaquant centre",
  "Avant-centre",
];

const FOOT_OPTIONS = [
  { value: "right", label: "Droit" },
  { value: "left",  label: "Gauche" },
  { value: "both",  label: "Les deux" },
];

// ── Strengths / weaknesses ────────────────────────────────────────────────────

const STRENGTHS_LIST = [
  "Vision de jeu", "Technique", "Endurance", "Vitesse", "Duels",
  "Finition", "Leadership", "Passes", "Puissance", "Tactique",
  "Jeu de tête", "Polyvalence", "Jeu sans ballon", "Pressing",
  "Centres", "Dribbles", "Agressivité",
];

const WEAKNESSES_LIST = [
  "Individualisme", "Technique", "Concentration", "Retour défensif",
  "Duels", "Placement", "Fragilité physique", "Vitesse",
  "Jeu de tête", "Jeu sans ballon", "Mono-pied",
];

const MAX_TAGS = 3;

function TagChip({
  label,
  selected,
  disabled,
  color,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  color: "green" | "red";
  onClick: () => void;
}) {
  const base = "px-2.5 py-1 rounded-full font-ui text-[11px] border transition-all cursor-pointer select-none";
  if (selected) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${
        color === "green"
          ? "bg-[rgba(22,255,110,0.15)] border-[rgba(22,255,110,0.4)] text-[var(--color-success)]"
          : "bg-[rgba(255,59,48,0.15)] border-[rgba(255,59,48,0.4)] text-[var(--color-danger)]"
      }`}>
        {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} bg-bg-surface-1 border-b-subtle text-t-muted ${
        disabled ? "opacity-30 cursor-not-allowed" : "hover:border-b-default hover:text-t-secondary"
      }`}
    >
      {label}
    </button>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface PlayerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player?: Player | null;
  onSubmit: (data: PlayerWriteFields) => void;
  submitting: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PlayerFormDialog({ open, onOpenChange, player, onSubmit, submitting }: PlayerFormDialogProps) {
  const [fullName, setFullName]           = useState("");
  const [nickname, setNickname]           = useState("");
  const [position, setPosition]           = useState("Milieu central");
  const [posAlt1, setPosAlt1]             = useState("");
  const [posAlt2, setPosAlt2]             = useState("");
  const [foot, setFoot]                   = useState("");
  const [shirtNumber, setShirtNumber]     = useState("");
  const [strengths, setStrengths]         = useState<string[]>([]);
  const [weaknesses, setWeaknesses]       = useState<string[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile]       = useState<File | null>(null);
  const [uploading, setUploading]         = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (player) {
      setFullName(player.full_name);
      setNickname(player.nickname || "");
      setPosition(player.position_preferred || "Milieu central");
      setPosAlt1(player.position_alternative_1 || "");
      setPosAlt2(player.position_alternative_2 || "");
      setFoot(player.foot_preferred || "");
      setShirtNumber(player.shirt_number?.toString() || "");
      setStrengths(player.strengths_tags ?? []);
      setWeaknesses(player.weaknesses_tags ?? []);
      setAvatarPreview(player.avatar_url);
      setAvatarFile(null);
    } else {
      setFullName(""); setNickname(""); setPosition("Milieu central");
      setPosAlt1(""); setPosAlt2(""); setFoot(""); setShirtNumber("");
      setStrengths([]); setWeaknesses([]);
      setAvatarPreview(null); setAvatarFile(null);
    }
  }, [player, open]);

  const toggleTag = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    tag: string
  ) => {
    if (list.includes(tag)) {
      setList(list.filter((t) => t !== tag));
    } else if (list.length < MAX_TAGS) {
      setList([...list, tag]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let avatar_url = player?.avatar_url || null;

    if (avatarFile) {
      setUploading(true);
      try {
        const tempId = player?.id || crypto.randomUUID();
        avatar_url = await uploadPlayerAvatar(avatarFile, tempId);
      } catch {
        // continue without avatar
      } finally {
        setUploading(false);
      }
    }

    onSubmit({
      full_name:               fullName.trim(),
      nickname:                nickname.trim() || null,
      avatar_url,
      position_preferred:      position || null,
      position_alternative_1:  posAlt1 || null,
      position_alternative_2:  posAlt2 || null,
      foot_preferred:          foot || null,
      shirt_number:            shirtNumber ? parseInt(shirtNumber) : null,
      strengths_tags:          strengths,
      weaknesses_tags:         weaknesses,
    });
  };

  const inputClass =
    "w-full font-ui text-[13px] bg-bg-surface-1 border border-b-default text-t-primary rounded-lg px-3 py-2.5 outline-none focus:border-primary transition-colors placeholder:text-t-muted";
  const selectClass = `${inputClass} cursor-pointer appearance-none`;

  const isSubmitting = submitting || uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-bg-surface-2 border-b-subtle sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-t-primary" style={{ fontSize: "var(--text-h3)" }}>
            {player ? "MODIFIER JOUEUR" : "AJOUTER JOUEUR"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Avatar */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative h-20 w-20 rounded-full bg-bg-surface-1 border-2 border-dashed border-b-default
                         hover:border-primary transition-colors overflow-hidden group cursor-pointer"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-6 w-6 text-t-muted mx-auto mt-6" />
              )}
              <div className="absolute inset-0 bg-bg-base/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-5 w-5 text-t-primary" />
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          {/* Nom + Surnom */}
          <div className="space-y-1">
            <label className="font-ui text-[11px] uppercase tracking-[0.15em] text-t-secondary">Nom complet</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Prénom Nom"
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className="font-ui text-[11px] uppercase tracking-[0.15em] text-t-secondary">Surnom (optionnel)</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ex: Dédé, Kev'…"
              className={inputClass}
            />
          </div>

          {/* Poste principal */}
          <div className="space-y-1">
            <label className="font-ui text-[11px] uppercase tracking-[0.15em] text-t-secondary">Poste principal</label>
            <select value={position} onChange={(e) => setPosition(e.target.value)} className={selectClass}>
              {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Postes alternatifs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-ui text-[11px] uppercase tracking-[0.15em] text-t-secondary">Poste alt. 1</label>
              <select value={posAlt1} onChange={(e) => setPosAlt1(e.target.value)} className={selectClass}>
                <option value="">—</option>
                {POSITIONS.filter((p) => p !== position).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-ui text-[11px] uppercase tracking-[0.15em] text-t-secondary">Poste alt. 2</label>
              <select value={posAlt2} onChange={(e) => setPosAlt2(e.target.value)} className={selectClass}>
                <option value="">—</option>
                {POSITIONS.filter((p) => p !== position && p !== posAlt1).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Numéro + Meilleur pied */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-ui text-[11px] uppercase tracking-[0.15em] text-t-secondary">Numéro</label>
              <input
                type="number" min="1" max="99"
                value={shirtNumber}
                onChange={(e) => setShirtNumber(e.target.value)}
                placeholder="—"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="font-ui text-[11px] uppercase tracking-[0.15em] text-t-secondary">Meilleur pied</label>
              <select value={foot} onChange={(e) => setFoot(e.target.value)} className={selectClass}>
                <option value="">—</option>
                {FOOT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>

          {/* Forces */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-ui text-[11px] uppercase tracking-[0.15em] text-t-secondary">
                Forces
              </label>
              <span className="font-ui text-[11px] text-t-muted">{strengths.length}/{MAX_TAGS}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STRENGTHS_LIST.map((tag) => (
                <TagChip
                  key={tag}
                  label={tag}
                  selected={strengths.includes(tag)}
                  disabled={!strengths.includes(tag) && strengths.length >= MAX_TAGS}
                  color="green"
                  onClick={() => toggleTag(strengths, setStrengths, tag)}
                />
              ))}
            </div>
          </div>

          {/* Faiblesses */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-ui text-[11px] uppercase tracking-[0.15em] text-t-secondary">
                Faiblesses
              </label>
              <span className="font-ui text-[11px] text-t-muted">{weaknesses.length}/{MAX_TAGS}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {WEAKNESSES_LIST.map((tag) => (
                <TagChip
                  key={tag}
                  label={tag}
                  selected={weaknesses.includes(tag)}
                  disabled={!weaknesses.includes(tag) && weaknesses.length >= MAX_TAGS}
                  color="red"
                  onClick={() => toggleTag(weaknesses, setWeaknesses, tag)}
                />
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !fullName.trim()}
            className="w-full font-ui text-[11px] font-semibold tracking-wider uppercase
                       px-4 py-3 rounded-lg bg-primary text-primary-text
                       hover:opacity-90 active:scale-[0.98] transition-all
                       disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Enregistrement…" : player ? "Enregistrer" : "Ajouter"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
