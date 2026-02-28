
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

async function detailMatches() {
    const { data: matches } = await supabase.from('partidos').select('*');
    const { data: extMatches } = await supabase.from('partidos_externos').select('*');
    const { data: rivals } = await supabase.from('rivales').select('*');
    const { data: playerStats } = await supabase.from('estadisticas_jugador').select('*');
    const { data: analyses } = await supabase.from('analisis_partido').select('*');

    const rivalsMap = {};
    rivals.forEach(r => rivalsMap[r.id_equipo || r.id] = r.nombre_equipo);

    const allMatches = [];

    matches.forEach(m => {
        allMatches.push({
            id: m.id,
            type: 'standard',
            local: "RC L'HOSPITALET",
            visitor: rivalsMap[m.Rival] || m.Rival || "Desconocido",
            date: m.fecha || "Sin fecha",
            jornada: m.jornada
        });
    });

    extMatches.forEach(m => {
        allMatches.push({
            id: m.id,
            type: 'external',
            local: m.equipo_local,
            visitor: m.equipo_visitante,
            date: m.fecha || "Sin fecha",
            jornada: m.jornada
        });
    });

    const hospiMatches = allMatches.filter(m => isHospi(m.local) || isHospi(m.visitor));

    console.log(`\n--- INFORME DETALLADO DE ESTADÍSTICAS POR PARTIDO ---\n`);

    hospiMatches.forEach(m => {
        const pStats = playerStats.filter(ps => ps.partido === m.id || ps.partido_externo === m.id);
        if (pStats.length === 0) return; // Only show matches with at least some stats

        const hospiPStats = pStats.filter(ps => isHospi(ps.equipo));
        const rivalPStats = pStats.filter(ps => !isHospi(ps.equipo));

        const analysis = analyses.find(a => a.partido_id === m.id || a.partido_externo_id === m.id || a.evento_id === m.id);
        let hasAdvanced = false;
        if (analysis && analysis.raw_json) {
            const root = typeof analysis.raw_json === 'string' ? JSON.parse(analysis.raw_json) : analysis.raw_json;
            const informe = root.analisis_individual_plantilla || root.analisis_video_nac_sport?.analisis_individual_plantilla;
            if (informe && informe.jugadores && informe.jugadores.length > 0) {
                hasAdvanced = true;
            }
        }

        const role = isHospi(m.local) ? "LOCAL" : "VISITANTE";
        const opponent = isHospi(m.local) ? m.visitor : m.local;

        console.log(`PARTIDO: Hospitalet [${role}] vs ${opponent}`);
        console.log(`Fecha: ${m.date} | Jornada: ${m.jornada || 'N/A'}`);
        console.log(`- Jugadores Hospitalet: ${hospiPStats.length}`);
        console.log(`- Jugadores Rival: ${rivalPStats.length}`);
        console.log(`- Análisis Avanzado (Notas/Placajes): ${hasAdvanced ? 'SÍ' : 'NO'}`);
        console.log(`------------------------------------------------------`);
    });
}

detailMatches();
