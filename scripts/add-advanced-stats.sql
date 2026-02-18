-- Add columns for Advanced Match Stats

-- Tackles
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS tackles_home_made INTEGER DEFAULT 0;
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS tackles_home_missed INTEGER DEFAULT 0;
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS tackles_away_made INTEGER DEFAULT 0;
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS tackles_away_missed INTEGER DEFAULT 0;

-- Rucks
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS rucks_home_won INTEGER DEFAULT 0;
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS rucks_home_lost INTEGER DEFAULT 0;
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS rucks_away_won INTEGER DEFAULT 0;
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS rucks_away_lost INTEGER DEFAULT 0;

-- Scrums (Melés)
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS scrums_home_won INTEGER DEFAULT 0;
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS scrums_home_lost INTEGER DEFAULT 0;
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS scrums_away_won INTEGER DEFAULT 0;
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS scrums_away_lost INTEGER DEFAULT 0;

-- Lineouts (Touches)
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS lineouts_home_won INTEGER DEFAULT 0;
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS lineouts_home_lost INTEGER DEFAULT 0;
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS lineouts_away_won INTEGER DEFAULT 0;
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS lineouts_away_lost INTEGER DEFAULT 0;

-- Territory (JSON for percentage per third/zone)
-- Structure example: { "home_22": 15, "home_mid": 40, "away_mid": 30, "away_22": 15 }
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS territory_data JSONB DEFAULT '{}'::jsonb;

-- Analyst Report
ALTER TABLE public.analisis_partido ADD COLUMN IF NOT EXISTS analyst_report TEXT;

NOTIFY pgrst, 'reload schema';
