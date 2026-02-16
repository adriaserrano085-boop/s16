-- Create table for external/rival players
CREATE TABLE IF NOT EXISTS jugadores_externos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    licencia TEXT UNIQUE NOT NULL,
    nombre_completo TEXT NOT NULL,
    ultimo_equipo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add reference to estadisticas_jugador
ALTER TABLE estadisticas_jugador 
ADD COLUMN IF NOT EXISTS jugador_externo UUID REFERENCES jugadores_externos(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE jugadores_externos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON jugadores_externos
    FOR ALL USING (true) WITH CHECK (true);
