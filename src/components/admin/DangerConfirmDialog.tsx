import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "reset" | "delete";
  clubName: string;
  onConfirm: () => void;
}

const ACTIONS = {
  reset: {
    title: "Réinitialiser la saison",
    description: "Cette action supprimera tous les matchs, entraînements et statistiques de la saison en cours. Cette action est irréversible.",
    buttonLabel: "Réinitialiser",
  },
  delete: {
    title: "Supprimer le club",
    description: "Cette action est irréversible. Toutes les données du club seront définitivement supprimées.",
    buttonLabel: "Supprimer définitivement",
  },
};

export function DangerConfirmDialog({ open, onOpenChange, action, clubName, onConfirm }: Props) {
  const [input, setInput] = useState("");
  const config = ACTIONS[action];
  const isMatch = input.trim().toLowerCase() === clubName.toLowerCase();

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setInput(""); }}>
      <DialogContent className="bg-bg-surface-1 border-b-subtle max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-ui text-[var(--color-danger)]">
            <AlertTriangle className="w-5 h-5" />
            {config.title}
          </DialogTitle>
          <DialogDescription className="font-ui text-t-secondary text-[var(--text-body)]">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="font-ui text-[var(--text-small)] text-t-secondary">
            Tapez <span className="font-semibold text-t-primary">"{clubName}"</span> pour confirmer :
          </p>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={clubName}
            className="bg-bg-surface-2 border-b-subtle font-ui"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { onOpenChange(false); setInput(""); }}
            className="font-ui text-[var(--text-small)] uppercase tracking-wider">
            Annuler
          </Button>
          <Button
            disabled={!isMatch}
            onClick={() => { onConfirm(); onOpenChange(false); setInput(""); }}
            className="bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]/90 font-ui text-[var(--text-small)] uppercase tracking-wider disabled:opacity-40"
          >
            {config.buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
