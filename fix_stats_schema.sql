-- Ensure columns are nullable for flexible linking
ALTER TABLE estadisticas_jugador ALTER COLUMN partido DROP NOT NULL;
ALTER TABLE estadisticas_jugador ALTER COLUMN jugador DROP NOT NULL;
ALTER TABLE estadisticas_jugador ALTER COLUMN jugador_externo DROP NOT NULL;

-- Verify FK (Just for reference, cannot re-declare easily without dropping)
-- Check if constraint exists, if not, create it.
-- DO NOTHING here regarding FK recreation to avoid errors if it exists.

-- Optional: Add index for performance
CREATE INDEX IF NOT EXISTS idx_stats_jugador_partido ON estadisticas_jugador(partido);
CREATE INDEX IF NOT EXISTS idx_stats_jugador_externo ON estadisticas_jugador(partido_externo);
