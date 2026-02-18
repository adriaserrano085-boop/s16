
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/tyqyixwqoxrrfvoeotax/sql/new

ALTER TABLE analisis_partido 
ADD COLUMN IF NOT EXISTS analyst_report TEXT,
ADD COLUMN IF NOT EXISTS timeline_data JSONB,
ADD COLUMN IF NOT EXISTS possession_home_pct INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS possession_away_pct INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS tackles_home_made INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tackles_home_missed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tackles_away_made INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tackles_away_missed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scrums_home_won INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scrums_home_lost INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scrums_away_won INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scrums_away_lost INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lineouts_home_won INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lineouts_home_lost INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lineouts_away_won INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lineouts_away_lost INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS territory_home_pct INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS territory_away_pct INTEGER DEFAULT 50;

-- Optional: Add raw_json if it was missed previously (though check confirms it exists)
-- ALTER TABLE analisis_partido ADD COLUMN IF NOT EXISTS raw_json JSONB;
