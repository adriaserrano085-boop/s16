import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugStandings() {
    console.log('--- AUDITING STANDINGS DATA ---');

    const { data: statsData, error: sError } = await supabase
        .from('estadisticas_partido')
        .select(`
            id, 
            marcador_local, 
            marcador_visitante, 
            ensayos_local,
            ensayos_visitante,
            partidos ( id, Rival, es_local, rivales(nombre_equipo) ),
            partidos_externos ( id, equipo_local, equipo_visitante )
        `);

    if (sError) {
        console.error('Error fetching stats:', sError);
        return;
    }

    console.log(`Found ${statsData.length} total stats records.`);

    statsData.forEach(stat => {
        const homeScore = stat.marcador_local;
        const awayScore = stat.marcador_visitante;

        let homeName = "N/A";
        let awayName = "N/A";

        if (stat.partidos) {
            const p = stat.partidos;
            const rival = p.rivales?.nombre_equipo || p.Rival || "Rival";
            if (p.es_local) { homeName = "RC HOSPITALET"; awayName = rival; }
            else { homeName = rival; awayName = "RC HOSPITALET"; }
        } else if (stat.partidos_externos) {
            homeName = stat.partidos_externos.equipo_local;
            awayName = stat.partidos_externos.equipo_visitante;
        }

        console.log(`[ID: ${stat.id}] ${homeName} ${homeScore} - ${awayScore} ${awayName} (Tries: ${stat.ensayos_local}-${stat.ensayos_visitante})`);

        if (homeScore === null || awayScore === null) {
            console.log('   >> WARNING: NULL scores detected.');
        } else if (homeScore === 0 && awayScore === 0) {
            console.log('   >> NOTE: 0-0 score. Verify if this is a real result or unplayed.');
        }
    });
}

debugStandings();
