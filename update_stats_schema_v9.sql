ALTER TABLE estadisticas_partido ADD COLUMN IF NOT EXISTS marcador_local INT;
ALTER TABLE estadisticas_partido ADD COLUMN IF NOT EXISTS marcador_visitante INT;
ALTER TABLE estadisticas_partido ADD COLUMN IF NOT EXISTS ensayos_local INT DEFAULT 0;
ALTER TABLE estadisticas_partido ADD COLUMN IF NOT EXISTS ensayos_visitante INT DEFAULT 0;
ALTER TABLE estadisticas_partido ADD COLUMN IF NOT EXISTS jornada INT;
ALTER TABLE estadisticas_partido ADD COLUMN IF NOT EXISTS fecha DATE;
