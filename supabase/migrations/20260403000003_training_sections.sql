-- Training sections and exercises
-- Allows coaches to structure a training session into named sections (e.g. Warm-up, Technical)
-- each containing ordered exercises with optional duration, material, and notes.

CREATE TABLE public.training_sections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  training_id uuid NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.training_exercises (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id uuid NOT NULL REFERENCES public.training_sections(id) ON DELETE CASCADE,
  training_id uuid NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_minutes integer,
  material text,
  notes text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.training_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaches_manage_sections"
ON public.training_sections FOR ALL TO authenticated
USING (training_id IN (
  SELECT t.id FROM trainings t
  JOIN team_members tm ON tm.team_id = t.team_id
  WHERE tm.user_id = auth.uid() AND tm.role = 'coach'
))
WITH CHECK (training_id IN (
  SELECT t.id FROM trainings t
  JOIN team_members tm ON tm.team_id = t.team_id
  WHERE tm.user_id = auth.uid() AND tm.role = 'coach'
));

CREATE POLICY "coaches_manage_exercises"
ON public.training_exercises FOR ALL TO authenticated
USING (training_id IN (
  SELECT t.id FROM trainings t
  JOIN team_members tm ON tm.team_id = t.team_id
  WHERE tm.user_id = auth.uid() AND tm.role = 'coach'
))
WITH CHECK (training_id IN (
  SELECT t.id FROM trainings t
  JOIN team_members tm ON tm.team_id = t.team_id
  WHERE tm.user_id = auth.uid() AND tm.role = 'coach'
));

CREATE INDEX training_sections_training_id_idx ON public.training_sections(training_id);
CREATE INDEX training_exercises_section_id_idx ON public.training_exercises(section_id);
CREATE INDEX training_exercises_training_id_idx ON public.training_exercises(training_id);
