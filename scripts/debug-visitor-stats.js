
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTeams() {
    const { data, error } = await supabase.from('estadisticas_jugador').select('equipo');
    if (error) {
        console.error(error);
        return;
    }

    const uniqueTeams = [...new Set(data.map(d => d.equipo))];
    console.log("Unique teams in estadisticas_jugador:");
    uniqueTeams.forEach(t => console.log(`- "${t}"`));

    // Also check for matches where Hospi might be visitor in partidos/partidos_externos
    const { data: matches } = await supabase.from('partidos').select('*');
    const { data: extMatches } = await supabase.from('partidos_externos').select('*');
    const { data: rivals } = await supabase.from('rivales').select('*');

    const rivalsMap = {};
    rivals.forEach(r => rivalsMap[r.id_equipo || r.id] = r.nombre_equipo);

    console.log("\nMatches in 'partidos' (Local vs Visitor):");
    matches.forEach(m => {
        console.log(`- "RC L'HOSPITALET" vs "${rivalsMap[m.Rival] || m.Rival}"`);
    });

    console.log("\nMatches in 'partidos_externos' (Local vs Visitor):");
    extMatches.forEach(m => {
        console.log(`- "${m.equipo_local}" vs "${m.equipo_visitante}"`);
    });
}

checkTeams();
