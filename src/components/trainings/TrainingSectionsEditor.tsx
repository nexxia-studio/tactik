import { useState } from "react";
import { Plus, Trash2, Pencil, Check, X, ClipboardList } from "lucide-react";
import {
  useTrainingSections,
  useInitDefaultSections,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useCreateExercise,
  useDeleteExercise,
  type TrainingSection,
} from "@/hooks/useTrainingSections";
import { useToast } from "@/hooks/use-toast";

interface Props {
  trainingId: string;
}

const inputClass =
  "bg-bg-surface-1 border border-b-default text-t-primary font-ui text-[12px] rounded-md px-2.5 py-1.5 outline-none focus:border-primary transition-colors placeholder:text-t-muted";

// ── Exercise add form ────────────────────────────────────────────────────────

function ExerciseForm({
  sectionId,
  nextPosition,
  trainingId,
  onDone,
}: {
  sectionId: string;
  nextPosition: number;
  trainingId: string;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const createExercise = useCreateExercise(trainingId);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [material, setMaterial] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createExercise.mutateAsync({
        section_id: sectionId,
        name: name.trim(),
        duration_minutes: duration ? parseInt(duration) : null,
        material: material.trim() || null,
        notes: notes.trim() || null,
        position: nextPosition,
      });
      onDone();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-bg-surface-2 border border-b-subtle rounded-lg p-3 space-y-2 mt-1">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de l'exercice *"
          required
          autoFocus
          className={`${inputClass} flex-1`}
        />
        <input
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          type="number"
          min="1"
          max="120"
          placeholder="min"
          className={`${inputClass} w-16 text-center`}
        />
      </div>
      <input
        value={material}
        onChange={(e) => setMaterial(e.target.value)}
        placeholder="Matériel (cônes, ballon…)"
        className={`${inputClass} w-full`}
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes / description"
        rows={2}
        className={`${inputClass} w-full resize-none`}
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onDone}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md font-ui text-[11px] text-t-secondary hover:text-t-primary border border-b-subtle hover:border-b-default transition-colors cursor-pointer"
        >
          <X className="h-3 w-3" /> Annuler
        </button>
        <button
          type="submit"
          disabled={createExercise.isPending || !name.trim()}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md font-ui text-[11px] bg-primary text-primary-text hover:opacity-90 disabled:opacity-50 cursor-pointer transition-opacity"
        >
          <Check className="h-3 w-3" /> Ajouter
        </button>
      </div>
    </form>
  );
}

// ── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  section,
  trainingId,
}: {
  section: TrainingSection;
  trainingId: string;
}) {
  const { toast } = useToast();
  const updateSection = useUpdateSection(trainingId);
  const deleteSection = useDeleteSection(trainingId);
  const deleteExercise = useDeleteExercise(trainingId);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(section.name);
  const [addingExercise, setAddingExercise] = useState(false);

  const handleRename = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === section.name) { setEditingName(false); return; }
    try {
      await updateSection.mutateAsync({ id: section.id, name: trimmed });
      setEditingName(false);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteSection = async () => {
    if (!window.confirm(`Supprimer la section "${section.name}" et tous ses exercices ?`)) return;
    try {
      await deleteSection.mutateAsync(section.id);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteExercise = async (exId: string) => {
    try {
      await deleteExercise.mutateAsync(exId);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="bg-bg-surface-1 border border-b-subtle rounded-xl overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-bg-surface-2 border-b border-b-subtle">
        {editingName ? (
          <input
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") { setNameValue(section.name); setEditingName(false); } }}
            autoFocus
            className={`${inputClass} flex-1`}
          />
        ) : (
          <span className="flex-1 font-display text-[12px] text-t-primary uppercase tracking-wider">
            {section.name}
          </span>
        )}
        <button
          onClick={() => { setNameValue(section.name); setEditingName(!editingName); }}
          className="p-1 text-t-muted hover:text-t-primary transition-colors cursor-pointer"
          title="Renommer"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={handleDeleteSection}
          disabled={deleteSection.isPending}
          className="p-1 text-t-muted hover:text-[var(--color-danger)] transition-colors cursor-pointer disabled:opacity-50"
          title="Supprimer la section"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Exercise list */}
      <div className="px-4 py-2 space-y-1">
        {section.training_exercises.map((ex) => (
          <div key={ex.id} className="flex items-start gap-2 py-1.5 border-b border-b-subtle last:border-0">
            <div className="flex-1 min-w-0">
              <p className="font-ui text-[12px] text-t-primary">
                {ex.name}
                {ex.duration_minutes && (
                  <span className="ml-2 text-t-muted text-[11px]">{ex.duration_minutes} min</span>
                )}
              </p>
              {ex.material && (
                <p className="font-ui text-[11px] text-t-secondary">📦 {ex.material}</p>
              )}
              {ex.notes && (
                <p className="font-ui text-[11px] text-t-muted italic">{ex.notes}</p>
              )}
            </div>
            <button
              onClick={() => handleDeleteExercise(ex.id)}
              className="shrink-0 p-1 text-t-muted hover:text-[var(--color-danger)] transition-colors cursor-pointer"
              title="Supprimer l'exercice"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}

        {addingExercise ? (
          <ExerciseForm
            sectionId={section.id}
            nextPosition={section.training_exercises.length}
            trainingId={trainingId}
            onDone={() => setAddingExercise(false)}
          />
        ) : (
          <button
            onClick={() => setAddingExercise(true)}
            className="flex items-center gap-1.5 py-2 font-ui text-[11px] text-t-muted hover:text-primary transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter un exercice
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────

export function TrainingSectionsEditor({ trainingId }: Props) {
  const { toast } = useToast();
  const { data: sections = [], isLoading } = useTrainingSections(trainingId);
  const initDefaults = useInitDefaultSections(trainingId);
  const createSection = useCreateSection(trainingId);

  const [addingSectionName, setAddingSectionName] = useState("");
  const [showAddSection, setShowAddSection] = useState(false);

  const handleInitDefaults = async () => {
    try {
      await initDefaults.mutateAsync();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = addingSectionName.trim();
    if (!name) return;
    try {
      await createSection.mutateAsync({ name, position: sections.length });
      setAddingSectionName("");
      setShowAddSection(false);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-14 bg-bg-surface-1 border border-b-subtle rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="font-ui text-[11px] text-t-muted uppercase tracking-wider flex items-center gap-1.5">
          <ClipboardList className="h-3.5 w-3.5" />
          Programme
        </h2>
        {sections.length > 0 && (
          <button
            onClick={() => setShowAddSection(true)}
            className="flex items-center gap-1 font-ui text-[11px] text-t-muted hover:text-primary transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Section
          </button>
        )}
      </div>

      {sections.length === 0 ? (
        /* Empty state */
        <div className="bg-bg-surface-1 border border-b-subtle rounded-xl p-6 flex flex-col items-center gap-3 text-center">
          <ClipboardList className="h-8 w-8 text-t-muted" />
          <div>
            <p className="font-ui text-[13px] text-t-secondary">Aucun programme défini</p>
            <p className="font-ui text-[11px] text-t-muted mt-0.5">
              Structurez votre séance en sections et exercices.
            </p>
          </div>
          <button
            onClick={handleInitDefaults}
            disabled={initDefaults.isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-ui text-[11px] font-semibold tracking-wider uppercase bg-primary text-primary-text hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            {initDefaults.isPending ? "Création…" : "Initialiser le programme"}
          </button>
        </div>
      ) : (
        /* Sections list */
        <div className="space-y-2">
          {sections.map((section) => (
            <SectionCard key={section.id} section={section} trainingId={trainingId} />
          ))}
        </div>
      )}

      {/* Add section form */}
      {showAddSection && (
        <form onSubmit={handleAddSection} className="flex gap-2">
          <input
            value={addingSectionName}
            onChange={(e) => setAddingSectionName(e.target.value)}
            placeholder="Nom de la section"
            autoFocus
            required
            className={`${inputClass} flex-1`}
          />
          <button
            type="submit"
            disabled={createSection.isPending || !addingSectionName.trim()}
            className="px-3 py-1.5 rounded-lg font-ui text-[11px] bg-primary text-primary-text hover:opacity-90 disabled:opacity-50 cursor-pointer transition-opacity"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => { setShowAddSection(false); setAddingSectionName(""); }}
            className="px-3 py-1.5 rounded-lg font-ui text-[11px] border border-b-subtle text-t-secondary hover:text-t-primary cursor-pointer transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </form>
      )}
    </section>
  );
}
