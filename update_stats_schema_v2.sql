-- Add minutos_jugados column to estadisticas_jugador
ALTER TABLE estadisticas_jugador 
ADD COLUMN IF NOT EXISTS minutos_jugados INT DEFAULT 0;
