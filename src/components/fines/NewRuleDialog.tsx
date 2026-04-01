import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import type { FineRule } from "@/data/mockFines";

interface Props {
  onAdd: (rule: Omit<FineRule, "id">) => void;
  trigger?: React.ReactNode;
}

export default function NewRuleDialog({ onAdd, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = () => {
    if (!label.trim() || !amount) return;
    onAdd({ label: label.trim(), amount: parseFloat(amount), is_active: isActive });
    setOpen(false);
    setLabel("");
    setAmount("");
    setIsActive(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="flex items-center gap-1.5 font-ui text-[12px] text-t-muted hover:text-primary transition-colors cursor-pointer py-1">
            <Plus className="h-3 w-3" />
            Ajouter une règle
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-bg-surface-1 border-b-subtle max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-t-primary uppercase text-[16px]">
            Nouvelle règle
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-ui text-[12px] text-t-secondary">Motif</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Oubli maillot"
              className="bg-bg-surface-2 border-b-subtle font-ui text-[13px] text-t-primary"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-ui text-[12px] text-t-secondary">Montant (€)</Label>
            <Input
              type="number"
              step="0.50"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5.00"
              className="bg-bg-surface-2 border-b-subtle font-ui text-[13px] text-t-primary w-28"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label className="font-ui text-[13px] text-t-secondary">Règle active</Label>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!label.trim() || !amount}
            className="w-full bg-primary text-primary-text font-ui hover:opacity-90"
          >
            Créer la règle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
