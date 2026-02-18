-- 1. Add evento_id column to analisis_partido
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS evento_id UUID REFERENCES public.eventos(id) ON DELETE CASCADE;

-- 2. Migrate existing data: Link to eventos via partidos table
UPDATE public.analisis_partido
SET evento_id = p."Evento"
FROM public.partidos p
WHERE public.analisis_partido.partido_id = p.id
AND public.analisis_partido.evento_id IS NULL;

-- 3. Make partido_id optional (nullable) so we can have analysis without a 'partido' record
ALTER TABLE public.analisis_partido ALTER COLUMN partido_id DROP NOT NULL;

-- 4. Add constraint to ensure at least one link exists (optional but good practice)
-- CHECK (partido_id IS NOT NULL OR evento_id IS NOT NULL)

-- 5. Update Unique Constraint
-- We want to ensure one analysis per event.
-- Drop old constraint if exists
ALTER TABLE public.analisis_partido DROP CONSTRAINT IF EXISTS analisis_partido_partido_id_key;
-- Add new unique constraint on evento_id
ALTER TABLE public.analisis_partido ADD CONSTRAINT analisis_partido_evento_id_key UNIQUE (evento_id);

-- 6. Refresh Policies (just in case)
GRANT ALL ON public.analisis_partido TO authenticated;
GRANT SELECT ON public.analisis_partido TO anon;
