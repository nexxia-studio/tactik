import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  currentGoal: string;
  currentAmount: number;
  onSave: (goal: string, amount: number) => void;
}

export default function EditGoalDialog({ currentGoal, currentAmount, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState(currentGoal);
  const [amount, setAmount] = useState(currentAmount.toString());

  const handleSubmit = () => {
    if (!goal.trim() || !amount) return;
    onSave(goal.trim(), parseFloat(amount));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) { setGoal(currentGoal); setAmount(currentAmount.toString()); } }}>
      <DialogTrigger asChild>
        <button className="font-ui text-[12px] text-primary hover:underline cursor-pointer">
          Modifier l'objectif
        </button>
      </DialogTrigger>
      <DialogContent className="bg-bg-surface-1 border-b-subtle max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-t-primary uppercase text-[16px]">
            Objectif saison
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-ui text-[12px] text-t-secondary">Nom de l'objectif</Label>
            <Input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Ex: Souper de fin de saison"
              className="bg-bg-surface-2 border-b-subtle font-ui text-[13px] text-t-primary"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-ui text-[12px] text-t-secondary">Montant objectif (€)</Label>
            <Input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-bg-surface-2 border-b-subtle font-ui text-[13px] text-t-primary w-28"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!goal.trim() || !amount}
            className="w-full bg-primary text-primary-text font-ui hover:opacity-90"
          >
            Sauvegarder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
