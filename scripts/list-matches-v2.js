
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listMatches() {
    console.log("Listing matches from 'estadisticas_partido'...");

    const { data: statsData, error } = await supabase
        .from('estadisticas_partido')
        .select(`
            id, 
            marcador_local, 
            marcador_visitante, 
            partidos ( id, Rival, es_local, rivales(nombre_equipo), eventos(fecha) ),
            partidos_externos ( id, fecha, equipo_local, equipo_visitante )
        `);

    if (error) {
        console.error("Error fetching stats:", error);
        return;
    }

    console.log(`Total stats records: ${statsData.length}`);

    const summarized = statsData.map(stat => {
        let date, home, away, type;
        if (stat.partidos) {
            type = 'INTERNAL';
            date = stat.partidos.eventos?.fecha || 'N/A';
            const rival = stat.partidos.rivales?.nombre_equipo || stat.partidos.Rival;
            if (stat.partidos.es_local) {
                home = 'RC HOSPITALET'; // Assumption
                away = rival;
            } else {
                home = rival;
                away = 'RC HOSPITALET';
            }
        } else if (stat.partidos_externos) {
            type = 'EXTERNAL';
            date = stat.partidos_externos.fecha;
            home = stat.partidos_externos.equipo_local;
            away = stat.partidos_externos.equipo_visitante;
        } else {
            type = 'ORPHAN';
        }

        return {
            id: stat.id,
            type,
            date: date ? date.split('T')[0] : 'N/A',
            match: `${home} vs ${away}`,
            score: `${stat.marcador_local}-${stat.marcador_visitante}`
        };
    });

    // Sort by date
    summarized.sort((a, b) => a.date.localeCompare(b.date));

    summarized.forEach(s => {
        console.log(`[${s.type}] ${s.date}: ${s.match} (${s.score})`);
    });
}

listMatches();
