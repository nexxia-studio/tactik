import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { FineRule } from "@/hooks/useFines";

interface Player {
  id: string;
  full_name: string;
  shirt_number: number | null;
}

interface NewFineDialogProps {
  players: Player[];
  rules: FineRule[];
  onAdd: (data: { player_id: string; fine_rule_id: string | null; reason: string; amount: number }) => void;
  trigger?: React.ReactNode;
}

export default function NewFineDialog({ players, rules, onAdd, trigger }: NewFineDialogProps) {
  const [open, setOpen] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [ruleId, setRuleId] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [amount, setAmount] = useState("");

  const activeRules = rules.filter((r) => r.is_active);
  const selectedRule = activeRules.find((r) => r.id === ruleId);

  const handleRuleChange = (val: string) => {
    setRuleId(val);
    if (val !== "other") {
      const rule = activeRules.find((r) => r.id === val);
      if (rule) setAmount(rule.amount.toFixed(2));
    } else {
      setAmount("");
    }
  };

  const handleSubmit = () => {
    if (!playerId || !amount) return;
    const isCustom = ruleId === "other";
    onAdd({
      player_id: playerId,
      fine_rule_id: isCustom ? null : (ruleId || null),
      reason: isCustom ? customLabel : (selectedRule?.label ?? ""),
      amount: parseFloat(amount),
    });
    setOpen(false);
    setPlayerId("");
    setRuleId("");
    setCustomLabel("");
    setAmount("");
  };

  const canSubmit = !!playerId && !!amount && (ruleId === "other" ? !!customLabel : !!ruleId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary text-primary-text font-ui hover:opacity-90 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span className="uppercase text-[12px] tracking-wider">Nouvelle amende</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-bg-surface-1 border-b-subtle max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-t-primary uppercase text-[16px]">
            Nouvelle amende
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="font-ui text-[12px] text-t-secondary">Joueur</Label>
            <Select value={playerId} onValueChange={setPlayerId}>
              <SelectTrigger className="bg-bg-surface-2 border-b-subtle font-ui text-[13px] text-t-primary">
                <SelectValue placeholder="Sélectionner un joueur" />
              </SelectTrigger>
              <SelectContent className="bg-bg-surface-1 border-b-subtle">
                {players.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="font-ui text-[13px]">
                    {p.shirt_number != null ? `#${p.shirt_number} — ` : ""}{p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="font-ui text-[12px] text-t-secondary">Motif</Label>
            <Select value={ruleId} onValueChange={handleRuleChange}>
              <SelectTrigger className="bg-bg-surface-2 border-b-subtle font-ui text-[13px] text-t-primary">
                <SelectValue placeholder="Sélectionner un motif" />
              </SelectTrigger>
              <SelectContent className="bg-bg-surface-1 border-b-subtle">
                {activeRules.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="font-ui text-[13px]">
                    {r.label} — {r.amount.toFixed(2)} €
                  </SelectItem>
                ))}
                <SelectItem value="other" className="font-ui text-[13px] italic">
                  Autre motif...
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {ruleId === "other" && (
            <div className="space-y-1.5">
              <Label className="font-ui text-[12px] text-t-secondary">Motif personnalisé</Label>
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="Ex: Oubli crampons"
                className="bg-bg-surface-2 border-b-subtle font-ui text-[13px] text-t-primary"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="font-ui text-[12px] text-t-secondary">Montant (€)</Label>
            <Input
              type="number"
              step="0.50"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-bg-surface-2 border-b-subtle font-ui text-[13px] text-t-primary w-28"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full bg-primary text-primary-text font-ui hover:opacity-90"
          >
            Ajouter l'amende
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
