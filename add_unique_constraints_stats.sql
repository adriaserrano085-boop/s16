-- Add unique constraint to partido_externo to allow UPSERT operations
-- This is necessary to fix error 42P10
BEGIN;
  ALTER TABLE public.estadisticas_partido ADD CONSTRAINT estadisticas_partido_partido_externo_key UNIQUE (partido_externo);
COMMIT;
