-- 1. Add partido_externo_id column
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS partido_externo_id UUID REFERENCES public.partidos_externos(id) ON DELETE CASCADE;

-- 2. Update Constraints: Ensure unique analysis per entity
-- We already have unique(evento_id) and unique(partido_id) implicitly if we kept them?
-- Actually, let's just make sure we can have ONE of them.
-- A partial index is better for this:
CREATE UNIQUE INDEX IF NOT EXISTS analisis_partido_externo_idx ON public.analisis_partido(partido_externo_id) WHERE partido_externo_id IS NOT NULL;

-- 3. Relax previous constraints if needed (we made partido_id nullable before)
-- Ensure evento_id is also nullable if we want to allow analysis tied ONLY to external match (valid if external match isn't an event?)
-- But wait, external matches ARE displayed in the calendar?
-- The user said "rival matches are not in events".
-- If they are NOT in events, they won't have an evento_id.
-- So we MUST make evento_id nullable too.

ALTER TABLE public.analisis_partido ALTER COLUMN evento_id DROP NOT NULL;

-- 4. Constraint: Must have at least one link
ALTER TABLE public.analisis_partido DROP CONSTRAINT IF EXISTS check_analysis_link;
ALTER TABLE public.analisis_partido ADD CONSTRAINT check_analysis_link 
    CHECK (
        (partido_id IS NOT NULL) OR 
        (evento_id IS NOT NULL) OR 
        (partido_externo_id IS NOT NULL)
    );
