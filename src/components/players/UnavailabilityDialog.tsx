import { useState } from "react";
import { CalendarIcon, Plus } from "lucide-react";
import { format, addWeeks, addMonths } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { PlayerUnavailability } from "@/hooks/usePlayerUnavailabilities";

const REASONS: { value: PlayerUnavailability["reason"]; label: string }[] = [
  { value: "injury",   label: "Blessure" },
  { value: "vacation", label: "Vacances" },
  { value: "personal", label: "Personnel" },
  { value: "other",    label: "Autre" },
];

const SHORTCUTS = [
  { label: "1 sem.",  apply: (d: Date) => addWeeks(d, 1) },
  { label: "2 sem.",  apply: (d: Date) => addWeeks(d, 2) },
  { label: "1 mois",  apply: (d: Date) => addMonths(d, 1) },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerName: string;
  onSubmit: (data: {
    start_date: string;
    end_date: string;
    reason: PlayerUnavailability["reason"];
    notes: string;
  }) => Promise<void>;
  submitting?: boolean;
}

export function UnavailabilityDialog({ open, onOpenChange, playerName, onSubmit, submitting }: Props) {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate]     = useState<Date | undefined>(undefined);
  const [reason, setReason]       = useState<PlayerUnavailability["reason"]>("injury");
  const [notes, setNotes]         = useState("");

  const reset = () => {
    setStartDate(new Date());
    setEndDate(undefined);
    setReason("injury");
    setNotes("");
  };

  const applyShortcut = (fn: (d: Date) => Date) => {
    const base = startDate ?? new Date();
    setEndDate(fn(base));
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate) return;
    await onSubmit({
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date:   format(endDate,   "yyyy-MM-dd"),
      reason,
      notes: notes.trim(),
    });
    reset();
    onOpenChange(false);
  };

  const isValid = !!startDate && !!endDate && endDate >= startDate;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="bg-bg-base border-b-subtle max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-t-primary text-[16px]">
            DÉCLARER UNE INDISPONIBILITÉ
          </DialogTitle>
          <DialogDescription className="text-t-secondary font-ui text-[var(--text-small)]">
            {playerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Date de début */}
          <div className="space-y-2">
            <Label className="font-ui text-[12px] text-t-secondary">Date de début</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-ui bg-bg-surface-1 border-b-subtle hover:bg-bg-surface-2",
                    !startDate && "text-t-muted"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP", { locale: fr }) : "Choisir une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-bg-base border-b-subtle" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date de fin + raccourcis */}
          <div className="space-y-2">
            <Label className="font-ui text-[12px] text-t-secondary">Date de fin</Label>
            {/* Raccourcis */}
            <div className="flex gap-2">
              {SHORTCUTS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => applyShortcut(s.apply)}
                  className="px-3 py-1.5 rounded-lg font-ui text-[11px] bg-bg-surface-2 border border-b-subtle text-t-secondary hover:bg-bg-surface-3 hover:text-t-primary transition-colors cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-ui bg-bg-surface-1 border-b-subtle hover:bg-bg-surface-2",
                    !endDate && "text-t-muted"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP", { locale: fr }) : "Choisir une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-bg-base border-b-subtle" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(d) => !!startDate && d < startDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {endDate && startDate && endDate < startDate && (
              <p className="font-ui text-[11px] text-[var(--color-danger)]">
                La date de fin doit être après la date de début.
              </p>
            )}
          </div>

          {/* Raison */}
          <div className="space-y-2">
            <Label className="font-ui text-[12px] text-t-secondary">Raison</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as PlayerUnavailability["reason"])}>
              <SelectTrigger className="w-full bg-bg-surface-1 border-b-subtle font-ui text-[var(--text-body)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-bg-surface-2 border-b-subtle">
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="font-ui text-[var(--text-body)]">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes optionnelles */}
          <div className="space-y-2">
            <Label className="font-ui text-[12px] text-t-secondary">Précisions (optionnel)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex : fracture du pied gauche..."
              className="bg-bg-surface-1 border-b-subtle text-t-primary font-ui min-h-[72px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="w-full bg-primary text-primary-text font-ui hover:opacity-90 disabled:opacity-40"
          >
            <Plus className="h-4 w-4 mr-2" />
            {submitting ? "Enregistrement…" : "Déclarer l'indisponibilité"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
