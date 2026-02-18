-- Create table for Match Analysis
CREATE TABLE IF NOT EXISTS analisis_partido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partido_id UUID REFERENCES partidos(id) ON DELETE CASCADE,
    video_url TEXT,
    video_offset_sec INTEGER DEFAULT 0, -- Seconds from video start to match 00:00
    possession_home_pct FLOAT,
    possession_away_pct FLOAT,
    discipline_cost_meters INTEGER DEFAULT 0,
    discipline_cost_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(partido_id)
);

-- Optional: Comments for clarity
COMMENT ON TABLE analisis_partido IS 'Stores video analysis metadata and derived metrics for a match.';
