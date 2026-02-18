-- Create table for Match Analysis
CREATE TABLE IF NOT EXISTS public.analisis_partido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partido_id UUID REFERENCES public.partidos(id) ON DELETE CASCADE,
    video_url TEXT,
    video_offset_sec INTEGER DEFAULT 0, -- Seconds from video start to match 00:00
    possession_home_pct FLOAT,
    possession_away_pct FLOAT,
    discipline_cost_meters INTEGER DEFAULT 0,
    discipline_cost_points INTEGER DEFAULT 0,
    timeline_data JSONB, -- Stores the list of events with timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(partido_id)
);

-- Comments
COMMENT ON TABLE public.analisis_partido IS 'Stores video analysis metadata and derived metrics for a match.';

-- Enable RLS
ALTER TABLE public.analisis_partido ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'analisis_partido' AND policyname = 'Analysis viewable by everyone'
    ) THEN
        CREATE POLICY "Analysis viewable by everyone" ON public.analisis_partido FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'analisis_partido' AND policyname = 'Authenticated users can manage analysis'
    ) THEN
        CREATE POLICY "Authenticated users can manage analysis" ON public.analisis_partido FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END
$$;

GRANT ALL ON public.analisis_partido TO authenticated;
GRANT SELECT ON public.analisis_partido TO anon;
