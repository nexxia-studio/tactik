import { useState } from "react";
import { Plus, CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);
const MINUTES = [0, 15, 30, 45];

interface NewSessionData {
  date: string;
  time: string;
  location: string;
  notes: string;
}

interface NewSessionDialogProps {
  onAdd: (data: NewSessionData) => void;
}

export default function NewSessionDialog({ onAdd }: NewSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [hour, setHour] = useState(19);
  const [minute, setMinute] = useState(30);
  const [location, setLocation] = useState("Terrain de Xhoffraix");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setDate(undefined);
    setHour(19);
    setMinute(30);
    setLocation("Terrain de Xhoffraix");
    setNotes("");
  };

  const handleSubmit = () => {
    if (!date) return;
    onAdd({
      date: format(date, "yyyy-MM-dd"),
      time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      location: location.trim() || "Terrain de Xhoffraix",
      notes: notes.trim(),
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <button className="px-4 py-2 rounded-lg font-ui text-[13px] uppercase tracking-wide transition-all cursor-pointer bg-primary text-primary-text flex items-center gap-2 hover:opacity-90">
          <Plus className="h-4 w-4" />
          Nouvelle séance
        </button>
      </DialogTrigger>
      <DialogContent className="bg-bg-base border-b-subtle max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-t-primary text-[16px]">NOUVELLE SÉANCE</DialogTitle>
          <DialogDescription className="text-t-secondary font-ui text-[var(--text-small)]">
            Planifier un nouvel entraînement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Date */}
          <div className="space-y-2">
            <Label className="font-ui text-[12px] text-t-secondary">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-ui bg-bg-surface-1 border-b-subtle hover:bg-bg-surface-2",
                    !date && "text-t-muted"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: fr }) : "Choisir une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-bg-base border-b-subtle" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label className="font-ui text-[12px] text-t-secondary">Heure</Label>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-bg-surface-1 border border-b-subtle rounded-lg overflow-hidden">
                <div className="h-[120px] overflow-y-auto scrollbar-thin snap-y snap-mandatory">
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      onClick={() => setHour(h)}
                      className={cn(
                        "w-full py-2 font-ui text-[15px] text-center snap-center transition-all cursor-pointer",
                        hour === h
                          ? "bg-primary text-primary-text font-semibold"
                          : "text-t-secondary hover:bg-bg-surface-2"
                      )}
                    >
                      {String(h).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
              <span className="font-display text-[20px] text-t-primary">:</span>
              <div className="flex-1 bg-bg-surface-1 border border-b-subtle rounded-lg overflow-hidden">
                <div className="h-[120px] overflow-y-auto scrollbar-thin snap-y snap-mandatory">
                  {MINUTES.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMinute(m)}
                      className={cn(
                        "w-full py-2 font-ui text-[15px] text-center snap-center transition-all cursor-pointer",
                        minute === m
                          ? "bg-primary text-primary-text font-semibold"
                          : "text-t-secondary hover:bg-bg-surface-2"
                      )}
                    >
                      {String(m).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="font-ui text-[12px] text-t-secondary">Lieu</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Terrain de Xhoffraix"
              className="bg-bg-surface-1 border-b-subtle text-t-primary font-ui"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="font-ui text-[12px] text-t-secondary">Notes (optionnel)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Objectifs de la séance..."
              className="bg-bg-surface-1 border-b-subtle text-t-primary font-ui min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!date}
            className="w-full bg-primary text-primary-text font-ui hover:opacity-90 disabled:opacity-40"
          >
            Créer la séance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
