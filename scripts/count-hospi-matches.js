
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

const HOSPITALET_NAMES = ["RC L'HOSPITALET", "RC HOSPITALET", "HOSPITALET", "L'HOSPITALET", "RC L'HOSPI", "HOSPI"];

const isHospi = (name) => {
    if (!name) return false;
    const n = name.toUpperCase();
    return HOSPITALET_NAMES.some(hn => n.includes(hn));
};

async function countMatches() {
    // 1. Basic player stats from estadisticas_jugador
    const { data: playerStats, error: err1 } = await supabase.from('estadisticas_jugador').select('partido, partido_externo, equipo');
    if (err1) {
        console.error(err1);
        return;
    }

    const hospiMatches = new Set();
    playerStats.forEach(stat => {
        if (isHospi(stat.equipo)) {
            const matchId = stat.partido || stat.partido_externo;
            if (matchId) hospiMatches.add(matchId);
        }
    });

    // 2. Advanced analysis from analisis_partido
    const { data: analyses, error: err2 } = await supabase.from('analisis_partido').select('raw_json');
    if (err2) {
        console.error(err2);
        return;
    }

    let advancedAnalysesCount = 0;
    analyses.forEach(a => {
        const root = a.raw_json || {};
        const informe = root.analisis_individual_plantilla || root.analisis_video_nac_sport?.analisis_individual_plantilla;
        if (informe && informe.jugadores && informe.jugadores.length > 0) {
            advancedAnalysesCount++;
        }
    });

    console.log(`\n--- Resumen de Estadísticas ---`);
    console.log(`Partidos del Hospitalet con estadísticas básicas de jugadores: ${hospiMatches.size}`);
    console.log(`Partidos con análisis técnico avanzado (Notas/Placajes): ${advancedAnalysesCount}`);
}

countMatches();
