-- Run this in the Supabase SQL Editor to create the required tables

-- Match-level stats (tracks which actas have been processed)
CREATE TABLE IF NOT EXISTS estadisticas_partido (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partido UUID REFERENCES partidos(id) ON DELETE CASCADE,
    acta_procesada BOOLEAN DEFAULT TRUE,
    fecha_procesado TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(partido)
);

-- Per-player per-match statistics
CREATE TABLE IF NOT EXISTS estadisticas_jugador (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partido UUID REFERENCES partidos(id) ON DELETE CASCADE,
    jugador UUID REFERENCES jugadores_propios(id) ON DELETE SET NULL,
    equipo TEXT NOT NULL,
    dorsal INT,
    nombre TEXT NOT NULL,
    ensayos INT DEFAULT 0,
    transformaciones INT DEFAULT 0,
    penales INT DEFAULT 0,
    drops INT DEFAULT 0,
    tarjetas_amarillas INT DEFAULT 0,
    tarjetas_rojas INT DEFAULT 0,
    es_capitan BOOLEAN DEFAULT FALSE,
    es_titular BOOLEAN DEFAULT TRUE
);

-- Enable Row Level Security (allow all for authenticated users)
ALTER TABLE estadisticas_partido ENABLE ROW LEVEL SECURITY;
ALTER TABLE estadisticas_jugador ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON estadisticas_partido
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON estadisticas_jugador
    FOR ALL USING (true) WITH CHECK (true);
