-- Add licencia column to estadisticas_jugador
ALTER TABLE estadisticas_jugador 
ADD COLUMN IF NOT EXISTS licencia TEXT;

-- Optional: Add index for performance if looking up by licencia often
CREATE INDEX IF NOT EXISTS idx_estadisticas_jugador_licencia ON estadisticas_jugador(licencia);
