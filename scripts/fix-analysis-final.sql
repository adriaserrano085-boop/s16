-- 1. FIX MISSING COLUMNS
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS timeline_data JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS discipline_cost_points INTEGER DEFAULT 0;

-- 2. FIX CONSTRAINTS for UPSERT
-- Replace partial index with a standard UNIQUE constraint for partido_externo_id
-- Postgres allows multiple NULLs in unique constraints, so this is safe and better for simple UPSERTs.

DROP INDEX IF EXISTS analisis_partido_externo_idx;
ALTER TABLE public.analisis_partido DROP CONSTRAINT IF EXISTS analisis_partido_partido_externo_id_key;

ALTER TABLE public.analisis_partido 
ADD CONSTRAINT analisis_partido_partido_externo_id_key UNIQUE (partido_externo_id);

-- 3. Ensure evento_id constraint exists
ALTER TABLE public.analisis_partido DROP CONSTRAINT IF EXISTS analisis_partido_evento_id_key;
ALTER TABLE public.analisis_partido ADD CONSTRAINT analisis_partido_evento_id_key UNIQUE (evento_id);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
