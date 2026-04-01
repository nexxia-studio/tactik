import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  home: string;
  away: string;
  currentHomeScore: number | null;
  currentAwayScore: number | null;
  onSave: (homeScore: number, awayScore: number) => void;
}

export default function EditScoreDialog({
  open,
  onOpenChange,
  home,
  away,
  currentHomeScore,
  currentAwayScore,
  onSave,
}: EditScoreDialogProps) {
  const [homeScore, setHomeScore] = useState(String(currentHomeScore ?? 0));
  const [awayScore, setAwayScore] = useState(String(currentAwayScore ?? 0));
  const [showConfirm, setShowConfirm] = useState(false);

  const handleOpen = (v: boolean) => {
    if (v) {
      setHomeScore(String(currentHomeScore ?? 0));
      setAwayScore(String(currentAwayScore ?? 0));
    }
    onOpenChange(v);
  };

  const handleSave = () => {
    const h = parseInt(homeScore, 10);
    const a = parseInt(awayScore, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    const h = parseInt(homeScore, 10);
    const a = parseInt(awayScore, 10);
    onSave(h, a);
    setShowConfirm(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open && !showConfirm} onOpenChange={handleOpen}>
        <DialogContent className="bg-bg-base border-b-subtle max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-t-primary text-[14px]">ENCODER LE SCORE</DialogTitle>
            <DialogDescription className="text-t-secondary font-ui text-[var(--text-small)]">
              Saisir le résultat final du match
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-4 py-4">
            <div className="flex-1 text-center space-y-2">
              <Label className="font-ui text-[12px] text-t-secondary">{home}</Label>
              <Input
                type="number"
                min={0}
                max={99}
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="bg-bg-surface-1 border-b-subtle text-t-primary font-display text-[28px] text-center h-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <span className="font-display text-[20px] text-t-muted mt-6">-</span>
            <div className="flex-1 text-center space-y-2">
              <Label className="font-ui text-[12px] text-t-secondary">{away}</Label>
              <Input
                type="number"
                min={0}
                max={99}
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="bg-bg-surface-1 border-b-subtle text-t-primary font-display text-[28px] text-center h-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleSave}
              className="w-full bg-primary text-primary-text font-ui hover:opacity-90"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-bg-base border-b-subtle">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-t-primary text-[14px]">CONFIRMER LE SCORE</AlertDialogTitle>
            <AlertDialogDescription className="text-t-secondary font-ui text-[var(--text-small)]">
              Enregistrer le score <span className="text-t-primary font-semibold">{home} {homeScore} - {awayScore} {away}</span> ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-ui bg-bg-surface-1 text-t-secondary border-b-subtle hover:bg-bg-surface-2">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-primary text-primary-text font-ui hover:opacity-90"
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
