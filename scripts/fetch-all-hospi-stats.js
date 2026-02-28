
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

async function fetchAllStats() {
    let allStats = [];
    let from = 0;
    let step = 1000;

    while (true) {
        const { data, error } = await supabase.from('estadisticas_jugador').select('*').range(from, from + step - 1);
        if (error) break;
        if (!data || data.length === 0) break;
        allStats = allStats.concat(data);
        from += step;
    }

    const { data: matches } = await supabase.from('partidos').select('*');
    const { data: rivals } = await supabase.from('rivales').select('*');
    const rivalsMap = {};
    rivals.forEach(r => rivalsMap[r.id_equipo || r.id] = r.nombre_equipo);

    const hospiStatsByMatch = {};
    allStats.forEach(s => {
        if (isHospi(s.equipo)) {
            const mId = s.partido;
            if (!mId) return;
            if (!hospiStatsByMatch[mId]) hospiStatsByMatch[mId] = [];
            hospiStatsByMatch[mId].push(s);
        }
    });

    console.log(`\n--- TODOS LOS PARTIDOS DEL HOSPITALET (${Object.keys(hospiStatsByMatch).length}) ---\n`);

    const results = [];
    for (const mId in hospiStatsByMatch) {
        const m = matches.find(match => match.id === mId);
        if (!m) continue;

        const opponent = rivalsMap[m.Rival] || m.Rival;
        const stats = hospiStatsByMatch[mId];

        // Check if Hospi was Local or Visitor in this match
        // We can check the full match stats from estadisticas_jugador
        const allMatchStats = allStats.filter(s => s.partido === mId);
        const teams = [...new Set(allMatchStats.map(s => s.equipo))];
        const hospiTeam = teams.find(t => isHospi(t));
        const rivalTeam = teams.find(t => !isHospi(t));

        // Let's assume the "Rival" in the partidos table is always the opponent.
        // But who is Local? 
        // We can't know for sure from this table alone, but we can check the score.
        // Actually, the user says "hay cinco mas que consta cmo visitante".
        // Let's list all 10 and see if we can spot the 5 visitors.

        results.push({
            id: mId,
            opponent,
            hospiStats: stats.length,
            rivalStats: allMatchStats.length - stats.length,
            score: `${m.marcador_local} - ${m.marcador_visitante}`,
            date: m.fecha || "Sin fecha",
            jornada: m.jornada
        });
    }

    results.sort((a, b) => (a.jornada || 0) - (b.jornada || 0)).forEach(r => {
        console.log(`Partido: RC L'HOSPITALET vs ${r.opponent}`);
        console.log(`Score: ${r.score} | Jugadores Hospi: ${r.hospiStats}`);
        console.log(`-----------------------------------`);
    });
}

fetchAllStats();
