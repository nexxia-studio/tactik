import { useState } from "react";
import { Plus } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8h → 22h
const MINUTES = [0, 15, 30, 45];

interface NewFriendlyMatch {
  opponent: string;
  isHome: boolean;
  date: string;
  time: string;
  location: string;
}

interface AddFriendlyMatchDialogProps {
  onAdd: (match: NewFriendlyMatch) => void;
}

export default function AddFriendlyMatchDialog({ onAdd }: AddFriendlyMatchDialogProps) {
  const [open, setOpen] = useState(false);
  const [opponent, setOpponent] = useState("");
  const [isHome, setIsHome] = useState(true);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [hour, setHour] = useState(15);
  const [minute, setMinute] = useState(0);
  const [location, setLocation] = useState("");

  const reset = () => {
    setOpponent("");
    setIsHome(true);
    setDate(undefined);
    setHour(15);
    setMinute(0);
    setLocation("");
  };

  const handleSubmit = () => {
    if (!opponent.trim() || !date) return;
    const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const dateStr = format(date, "yyyy-MM-dd");
    onAdd({
      opponent: opponent.trim(),
      isHome,
      date: dateStr,
      time: timeStr,
      location: location.trim() || (isHome ? "Xhoffraix" : opponent.trim()),
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <button className="px-3 py-1.5 rounded-lg font-ui text-[12px] transition-all cursor-pointer bg-primary text-primary-text flex items-center gap-1.5 hover:opacity-90">
          <Plus className="h-3.5 w-3.5" />
          Amical
        </button>
      </DialogTrigger>
      <DialogContent className="bg-bg-base border-b-subtle max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-t-primary text-[16px]">MATCH AMICAL</DialogTitle>
          <DialogDescription className="text-t-secondary font-ui text-[var(--text-small)]">
            Ajouter un match amical au calendrier
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Opponent */}
          <div className="space-y-2">
            <Label className="font-ui text-[12px] text-t-secondary">Équipe adverse</Label>
            <Input
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="Nom de l'équipe"
              className="bg-bg-surface-1 border-b-subtle text-t-primary font-ui"
            />
          </div>

          {/* Home / Away */}
          <div className="space-y-2">
            <Label className="font-ui text-[12px] text-t-secondary">Lieu</Label>
            <div className="flex gap-2">
              {[
                { value: true, label: "Domicile" },
                { value: false, label: "Extérieur" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setIsHome(opt.value)}
                  className={`flex-1 px-3 py-2 rounded-lg font-ui text-[13px] transition-all cursor-pointer ${
                    isHome === opt.value
                      ? "bg-primary text-primary-text"
                      : "bg-bg-surface-1 text-t-secondary border border-b-subtle hover:bg-bg-surface-2"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location override */}
          <div className="space-y-2">
            <Label className="font-ui text-[12px] text-t-secondary">Lieu (optionnel)</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={isHome ? "Xhoffraix" : opponent || "Lieu"}
              className="bg-bg-surface-1 border-b-subtle text-t-primary font-ui"
            />
          </div>

          {/* Date picker */}
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

          {/* Time picker — scroll wheels */}
          <div className="space-y-2">
            <Label className="font-ui text-[12px] text-t-secondary">Heure</Label>
            <div className="flex items-center gap-3">
              {/* Hour wheel */}
              <div className="flex-1 bg-bg-surface-1 border border-b-subtle rounded-lg overflow-hidden">
                <div className="h-[140px] overflow-y-auto scrollbar-thin snap-y snap-mandatory">
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      onClick={() => setHour(h)}
                      className={cn(
                        "w-full py-2.5 font-ui text-[16px] text-center snap-center transition-all cursor-pointer",
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

              {/* Minute wheel */}
              <div className="flex-1 bg-bg-surface-1 border border-b-subtle rounded-lg overflow-hidden">
                <div className="h-[140px] overflow-y-auto scrollbar-thin snap-y snap-mandatory">
                  {MINUTES.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMinute(m)}
                      className={cn(
                        "w-full py-2.5 font-ui text-[16px] text-center snap-center transition-all cursor-pointer",
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
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!opponent.trim() || !date}
            className="w-full bg-primary text-primary-text font-ui hover:opacity-90 disabled:opacity-40"
          >
            Ajouter le match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
