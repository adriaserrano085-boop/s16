
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

const normalizePlayerName = (s) => s?.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "";

const findAggregatedPlayer = (aggregated, searchName, dorsal) => {
    if (!searchName) return null;
    const sName = normalizePlayerName(searchName);
    const sParts = sName.split(" ").filter(p => p.length > 2);

    for (const key in aggregated) {
        const p = aggregated[key];
        const pName = normalizePlayerName(p.name);
        if (pName === sName) return p;

        if (searchName.includes(",")) {
            const parts = searchName.split(",").map(p => p.trim());
            if (parts.length === 2) {
                const alt = normalizePlayerName(`${parts[1]} ${parts[0]}`);
                if (pName === alt) return p;
            }
        }
    }

    for (const key in aggregated) {
        const p = aggregated[key];
        const pName = normalizePlayerName(p.name);
        const matchCount = sParts.filter(part => pName.includes(part)).length;
        if (matchCount >= Math.max(1, Math.floor(sParts.length * 0.7))) {
            return p;
        }
    }
    return null;
};

async function debug() {
    const { data: rawStats } = await supabase.from('estadisticas_jugador').select('*');
    const { data: analysesData } = await supabase.from('analisis_partido').select('raw_json');

    const aggregated = {};
    rawStats.forEach(stat => {
        const key = stat.licencia || stat.jugador || (stat.nombre + '-' + stat.equipo);
        if (!aggregated[key]) {
            aggregated[key] = {
                name: stat.nombre,
                tackles_made: 0,
                tackles_missed: 0,
                total_nota: 0,
                count_nota: 0
            };
        }
    });

    console.log(`Aggregating ${analysesData?.length || 0} analyses into ${Object.keys(aggregated).length} players...`);

    analysesData.forEach((analysis, idx) => {
        const root = analysis.raw_json || {};
        const informe = root.analisis_individual_plantilla || root.analisis_video_nac_sport?.analisis_individual_plantilla;
        if (informe && Array.isArray(informe.jugadores)) {
            informe.jugadores.forEach(j => {
                const pName = j.nombre || j.perfil?.nombre;
                const match = findAggregatedPlayer(aggregated, pName, j.dorsal);
                if (match) {
                    const nota = j.nota || j.valoracion?.nota || j.nota_media;
                    if (typeof nota === 'number' && nota > 0) {
                        match.total_nota += nota;
                        match.count_nota += 1;
                    }
                }
            });
        }

        const nac = root.analisis_video_nac_sport || {};
        const def = nac.rendimiento_individual_defensivo;
        if (def) {
            const processTacklers = (list) => {
                if (!Array.isArray(list)) return;
                list.forEach(t => {
                    const match = findAggregatedPlayer(aggregated, t.nombre, t.dorsal);
                    if (match) {
                        match.tackles_made += (t.placajes_ganados || 0);
                        match.tackles_missed += (t.placajes_perdidos || 0);
                    }
                });
            };
            processTacklers(def.top_tacklers_los_muros);
            processTacklers(def.alertas_rendimiento_focos_de_rotura);
        }
    });

    const matches = Object.values(aggregated).filter(p => p.count_nota > 0 || p.tackles_made > 0);
    console.log(`\nMatched ${matches.length} players with advanced stats:`);
    matches.forEach(p => {
        console.log(`- ${p.name}: Nota Avg: ${(p.total_nota / p.count_nota || 0).toFixed(1)} (${p.count_nota} matches), Tackles: ${p.tackles_made}/${p.tackles_missed}`);
    });
}

debug();
