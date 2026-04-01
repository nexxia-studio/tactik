import { useState, useEffect, useRef } from "react";
import { Camera } from "lucide-react";
import type { Player } from "@/hooks/usePlayers";
import { uploadPlayerAvatar } from "@/hooks/usePlayers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const POSITIONS = ["Gardien", "Défenseur", "Milieu", "Attaquant"];

interface PlayerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player?: Player | null;
  onSubmit: (data: {
    full_name: string;
    position_preferred: string | null;
    shirt_number: number | null;
    avatar_url: string | null;
    nickname: string | null;
  }) => void;
  submitting: boolean;
}

export function PlayerFormDialog({ open, onOpenChange, player, onSubmit, submitting }: PlayerFormDialogProps) {
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [position, setPosition] = useState("Milieu");
  const [shirtNumber, setShirtNumber] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (player) {
      setFullName(player.full_name);
      setNickname(player.nickname || "");
      setPosition(player.position_preferred || "Milieu");
      setShirtNumber(player.shirt_number?.toString() || "");
      setAvatarPreview(player.avatar_url);
      setAvatarFile(null);
    } else {
      setFullName(""); setNickname(""); setPosition("Milieu");
      setShirtNumber(""); setAvatarPreview(null); setAvatarFile(null);
    }
  }, [player, open]);

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
        // silently continue without avatar
      } finally {
        setUploading(false);
      }
    }

    onSubmit({
      full_name: fullName.trim(),
      position_preferred: position || null,
      shirt_number: shirtNumber ? parseInt(shirtNumber) : null,
      avatar_url,
      nickname: nickname.trim() || null,
    });
  };

  const inputClass =
    "w-full font-ui text-[13px] bg-bg-surface-1 border border-b-default text-t-primary rounded-lg px-3 py-2.5 outline-none focus:border-primary transition-colors placeholder:text-t-muted";

  const isSubmitting = submitting || uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-bg-surface-2 border-b-subtle sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-t-primary" style={{ fontSize: "var(--text-h3)" }}>
            {player ? "MODIFIER JOUEUR" : "AJOUTER JOUEUR"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Avatar upload */}
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-ui text-[11px] uppercase tracking-[0.15em] text-t-secondary">Position</label>
              <select value={position} onChange={(e) => setPosition(e.target.value)} className={`${inputClass} cursor-pointer`}>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-ui text-[11px] uppercase tracking-[0.15em] text-t-secondary">Numéro</label>
              <input
                type="number"
                min="1"
                max="99"
                value={shirtNumber}
                onChange={(e) => setShirtNumber(e.target.value)}
                placeholder="—"
                className={inputClass}
              />
            </div>
          </div>

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
