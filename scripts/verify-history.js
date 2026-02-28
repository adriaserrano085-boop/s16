
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

async function verifyHistory() {
    const { data: rawStats } = await supabase.from('estadisticas_jugador').select('*');
    const { data: analyses } = await supabase.from('analisis_partido').select('*');

    const aggregated = {};
    rawStats.forEach(stat => {
        const key = stat.nombre + '-' + stat.equipo;
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

    // Merge analysis
    analyses.forEach(analysis => {
        const root = analysis.raw_json || {};
        const informe = root.analisis_individual_plantilla || root.analisis_video_nac_sport?.analisis_individual_plantilla;
        if (informe && Array.isArray(informe.jugadores)) {
            informe.jugadores.forEach(j => {
                const pName = j.nombre || j.perfil?.nombre;
                const p = Object.values(aggregated).find(pa => pa.name.includes(pName) || pName.includes(pa.name));
                if (p) {
                    const matchRecord = p.matchHistory.find(mh => mh.partido === (analysis.partido_id || analysis.partido || analysis.evento_id || analysis.partido_externo_id));
                    if (matchRecord) matchRecord.nota = j.nota || j.valoracion?.nota || j.nota_media;
                }
            });
        }
    });

    const sample = Object.values(aggregated).filter(p => isHospi(p.team)).find(p => p.matchHistory.some(m => m.nota));
    console.log("Sample Player History Verification:");
    if (sample) {
        console.log(`Player: ${sample.name}`);
        console.log(`Total matches in history: ${sample.matchHistory.length}`);
        sample.matchHistory.forEach(m => {
            console.log(`- Match: ${m.partido} | Nota: ${m.nota || 'N/A'}`);
        });
    } else {
        console.log("No player with history and analysis found in sample.");
    }
}

verifyHistory();
