-- 1. Ensure table exists
CREATE TABLE IF NOT EXISTS public.analisis_partido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partido_id UUID REFERENCES public.partidos(id) ON DELETE CASCADE,
    video_url TEXT,
    video_offset_sec INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(partido_id)
);

-- 2. Add column if missing
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS timeline_data JSONB;
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS discipline_cost_points INTEGER DEFAULT 0;

-- 3. Reset Policies safely
ALTER TABLE public.analisis_partido ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Drop existing policies to avoid conflicts
    DROP POLICY IF EXISTS "Analysis viewable by everyone" ON public.analisis_partido;
    DROP POLICY IF EXISTS "Authenticated users can manage analysis" ON public.analisis_partido;
    DROP POLICY IF EXISTS "Auth users can manage analysis" ON public.analisis_partido;
END $$;

-- 4. Re-create Policies
CREATE POLICY "Analysis viewable by everyone" ON public.analisis_partido FOR SELECT USING (true);
CREATE POLICY "Auth users can manage analysis" ON public.analisis_partido FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Grant permissions
GRANT ALL ON public.analisis_partido TO authenticated;
GRANT SELECT ON public.analisis_partido TO anon;
