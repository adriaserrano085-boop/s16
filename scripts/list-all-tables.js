import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listAllTables() {
    console.log('--- Listing All Tables and Probing Columns ---');

    // We can't list tables easily via the JS client, but we can try common ones or 
    // use a trick if the API exposes them.
    // Since we are in a project, we know most table names from services and SQL files.
    const knownTables = [
        'partidos', 'rivales', 'eventos', 'entrenamientos', 'asistencia',
        'jugadores_propios', 'jugadores_externos', 'partidos_externos',
        'estadisticas_partido', 'estadisticas_jugador', 'analisis_partido',
        'convocatorias', 'usuarios'
    ];

    for (const table of knownTables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`[ABSENT OR ERROR] ${table}: ${error.message}`);
        } else {
            const columns = data.length > 0 ? Object.keys(data[0]) : 'Empty (No columns detected via select)';
            console.log(`[FOUND] ${table}:`, columns);
        }
    }
}

listAllTables();
