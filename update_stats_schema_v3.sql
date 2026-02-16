-- Create new table for external matches
CREATE TABLE IF NOT EXISTS partidos_externos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha DATE NOT NULL,
    equipo_local TEXT NOT NULL,
    equipo_visitante TEXT NOT NULL,
    competicion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modify estadisticas_partido to allow linking to either partido OR partido_externo
ALTER TABLE estadisticas_partido 
ADD COLUMN IF NOT EXISTS partido_externo UUID REFERENCES partidos_externos(id) ON DELETE CASCADE;

-- Modify constraint: either partido OR partido_externo must be present (optional check)
-- ALTER TABLE estadisticas_partido ADD CONSTRAINT check_partido_source CHECK (partido IS NOT NULL OR partido_externo IS NOT NULL);

-- Modify estadisticas_jugador to allow linking to either partido OR partido_externo
ALTER TABLE estadisticas_jugador 
ADD COLUMN IF NOT EXISTS partido_externo UUID REFERENCES partidos_externos(id) ON DELETE CASCADE;

-- Relax NOT NULL constraint on 'partido' if it exists (assuming it was created as references partidos(id))
ALTER TABLE estadisticas_partido ALTER COLUMN partido DROP NOT NULL;
ALTER TABLE estadisticas_jugador ALTER COLUMN partido DROP NOT NULL;
