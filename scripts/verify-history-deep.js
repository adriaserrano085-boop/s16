
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

const normalizePlayerName = (name) => {
    if (!name) return "";
    return name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-j1-9\s]/g, "")
        .trim();
};

const findAggregatedPlayer = (aggregated, name, dorsal) => {
    const norm = normalizePlayerName(name);
    // 1. Precise name match
    for (const key in aggregated) {
        if (normalizePlayerName(aggregated[key].name) === norm) return aggregated[key];
    }
    // 2. Partial match
    for (const key in aggregated) {
        const agNorm = normalizePlayerName(aggregated[key].name);
        if (agNorm.includes(norm) || norm.includes(agNorm)) return aggregated[key];
    }
    return null;
};

async function verifyHistoryDeep() {
    const { data: rawStats } = await supabase.from('estadisticas_jugador').select('*');
    const { data: analyses } = await supabase.from('analisis_partido').select('*');

    const aggregated = {};
    rawStats.forEach(stat => {
        const key = stat.licencia || stat.jugador || (stat.nombre + '-' + stat.equipo);
        if (!aggregated[key]) {
            aggregated[key] = {
                name: stat.nombre,
                team: stat.equipo,
                matchHistory: []
            };
        }
        const p = aggregated[key];
        p.matchHistory.push({
            partido: stat.partido || stat.partido_externo,
            nota: null,
            tackles_made: 0
        });
    });

    analyses.forEach(analysis => {
        const root = analysis.raw_json || {};
        const informe = root.analisis_individual_plantilla || root.analisis_video_nac_sport?.analisis_individual_plantilla;
        if (informe && Array.isArray(informe.jugadores)) {
            informe.jugadores.forEach(j => {
                const pName = j.nombre || j.perfil?.nombre;
                const match = findAggregatedPlayer(aggregated, pName, j.dorsal);
                if (match) {
                    const matchRecord = match.matchHistory.find(mh => mh.partido === (analysis.partido_id || analysis.partido || analysis.evento_id || analysis.partido_externo_id));
                    if (matchRecord) matchRecord.nota = j.nota || j.valoracion?.nota || j.nota_media;
                }
            });
        }
    });

    const withHistory = Object.values(aggregated).filter(p => p.matchHistory.some(m => m.nota));
    console.log(`Found ${withHistory.length} players with notes in history.`);

    if (withHistory.length > 0) {
        const p = withHistory[0];
        console.log(`Player: ${p.name}`);
        p.matchHistory.filter(m => m.nota).forEach(m => {
            console.log(`- Match: ${m.partido} | Nota: ${m.nota}`);
        });
    }
}

verifyHistoryDeep();
