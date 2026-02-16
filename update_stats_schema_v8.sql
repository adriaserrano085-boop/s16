ALTER TABLE partidos_externos ADD COLUMN IF NOT EXISTS marcador_local INT;
ALTER TABLE partidos_externos ADD COLUMN IF NOT EXISTS marcador_visitante INT;
ALTER TABLE partidos_externos ADD COLUMN IF NOT EXISTS ensayos_local INT DEFAULT 0;
ALTER TABLE partidos_externos ADD COLUMN IF NOT EXISTS ensayos_visitante INT DEFAULT 0;
