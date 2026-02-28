
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function detailAllMatches() {
    const { data: matches } = await supabase.from('partidos').select('*');
    const { data: rivals } = await supabase.from('rivales').select('*');
    const { data: pStats } = await supabase.from('estadisticas_jugador').select('partido, equipo');

    const rivalsMap = {};
    rivals.forEach(r => rivalsMap[r.id_equipo || r.id] = r.nombre_equipo);

    console.log("--- ALL MATCHES IN 'partidos' TABLE ---");
    matches.sort((a, b) => (a.jornada || 0) - (b.jornada || 0)).forEach(m => {
        const rival = rivalsMap[m.Rival] || m.Rival;
        const stats = pStats.filter(ps => ps.partido === m.id);
        const hospiStatsCount = stats.filter(ps => ps.equipo === "RC L'HOSPITALET").length;
        const rivalStatsCount = stats.filter(ps => ps.equipo !== "RC L'HOSPITALET").length;

        console.log(`\nID: ${m.id} | Jornada: ${m.jornada}`);
        console.log(`Local (Assumed): RC L'HOSPITALET vs Visitor: ${rival}`);
        console.log(`Score: ${m.marcador_local} - ${m.marcador_visitante}`);
        console.log(`Stats - Hospi: ${hospiStatsCount}, Rival: ${rivalStatsCount}`);
    });
}

detailAllMatches();
