-- Add missing columns for PDF analysis
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS timeline_data JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS discipline_cost_points INTEGER DEFAULT 0;

-- Refresh schema cache hint for Supabase (sometimes needed)
NOTIFY pgrst, 'reload schema';
