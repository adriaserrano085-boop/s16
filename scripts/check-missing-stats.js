import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkMissingStats() {
    console.log('--- Checking for Missing Stats Records ---');

    // 1. Get all matches from partidos
    const { data: partidos, error: pError } = await supabase.from('partidos').select('*');
    if (pError) console.error('Error fetching partidos:', pError);

    // 2. Get all matches from partidos_externos
    const { data: externos, error: eError } = await supabase.from('partidos_externos').select('*');
    if (eError) console.error('Error fetching partidos_externos:', eError);

    // 3. Get all entries from estadisticas_partido
    const { data: stats, error: sError } = await supabase.from('estadisticas_partido').select('*');
    if (sError) console.error('Error fetching estadisticas_partido:', sError);

    console.log(`Total Partidos: ${partidos?.length || 0}`);
    console.log(`Total Partidos Externos: ${externos?.length || 0}`);
    console.log(`Total Estadisticas Partidos: ${stats?.length || 0}`);

    const statsPartidoIds = new Set(stats?.filter(s => s.partido).map(s => s.partido));
    const statsExternoIds = new Set(stats?.filter(s => s.partido_externo).map(s => s.partido_externo));

    const missingPartidos = partidos?.filter(p => !statsPartidoIds.has(p.id)) || [];
    const missingExternos = externos?.filter(e => !statsExternoIds.has(e.id)) || [];

    console.log(`\nPartidos missing stats: ${missingPartidos.length}`);
    missingPartidos.forEach(p => console.log(` - ID: ${p.id}, Rival: ${p.Rival}, Jornada: ${p.jornada}`));

    console.log(`\nExternos missing stats: ${missingExternos.length}`);
    missingExternos.forEach(e => console.log(` - ID: ${e.id}, ${e.equipo_local} vs ${e.equipo_visitante}, Jornada: ${e.jornada}`));

    if (missingPartidos.length > 0 || missingExternos.length > 0) {
        console.log('\n--- Suggestion: Run a script to initialize these stats ---');
    }
}

checkMissingStats();
