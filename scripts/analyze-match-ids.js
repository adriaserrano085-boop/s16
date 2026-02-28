
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

async function analyzePlayerStats() {
    const { data: pStats } = await supabase.from('estadisticas_jugador').select('*');
    const { data: matches } = await supabase.from('partidos').select('*');
    const { data: extMatches } = await supabase.from('partidos_externos').select('*');
    const { data: rivals } = await supabase.from('rivales').select('*');

    const rivalsMap = {};
    rivals.forEach(r => rivalsMap[r.id_equipo || r.id] = r.nombre_equipo);

    const matchIds = new Set(pStats.map(ps => ps.partido).filter(id => id));
    const extMatchIds = new Set(pStats.map(ps => ps.partido_externo).filter(id => id));

    console.log("--- ANALYZING MATCH IDs IN estadisticas_jugador ---");

    const allAnalyticIds = [
        ...[...matchIds].map(id => ({ id, type: 'standard' })),
        ...[...extMatchIds].map(id => ({ id, type: 'external' }))
    ];

    allAnalyticIds.forEach(mObj => {
        const stats = pStats.filter(ps => (mObj.type === 'standard' ? ps.partido : ps.partido_externo) === mObj.id);
        const teamsInMatch = [...new Set(stats.map(ps => ps.equipo))];
        const hospiTeam = teamsInMatch.find(t => isHospi(t));
        const rivalTeam = teamsInMatch.find(t => !isHospi(t));

        if (hospiTeam) {
            let matchInfo = "Unknown";
            if (mObj.type === 'standard') {
                const m = matches.find(match => match.id === mObj.id);
                if (m) {
                    const rivalFromRivalTable = rivalsMap[m.Rival] || m.Rival;
                    matchInfo = `Standard Table Match: Rival=${rivalFromRivalTable}`;
                }
            } else {
                const m = extMatches.find(match => match.id === mObj.id);
                if (m) {
                    matchInfo = `External Table Match: ${m.equipo_local} vs ${m.equipo_visitante}`;
                }
            }
            console.log(`\nMatch ID: ${mObj.id} (${mObj.type})`);
            console.log(`- Info: ${matchInfo}`);
            console.log(`- Teams with stats: ${teamsInMatch.join(", ")}`);

            // Determine if Hospi was Local or Visitor
            // If it's a 'standard' match, does the acta say who is local?
            // Let's check a few players from this match
            const sampleHospiPlayer = stats.find(ps => isHospi(ps.equipo));
            console.log(`- Sample Hospi Player: ${sampleHospiPlayer.nombre}, Dorsal: ${sampleHospiPlayer.dorsal}`);
        }
    });
}

analyzePlayerStats();
