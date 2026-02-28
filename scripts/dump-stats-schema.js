import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function dumpSchema() {
    console.log('--- Dumping Schema for Statistics Tables ---');

    // Probing columns by attempting an insert that fails or by fetching one record
    const tables = ['estadisticas_partido', 'estadisticas_jugador'];

    for (const table of tables) {
        console.log(`\nChecking table: ${table}`);
        const { data, error } = await supabase.from(table).select('*').limit(1);

        if (error) {
            console.error(`Error fetching from ${table}:`, error.message);
            continue;
        }

        if (data && data.length > 0) {
            console.log(`Columns for ${table}:`, Object.keys(data[0]));
        } else {
            // If no data, try to get column names from an empty insert (risky but often works to see error if keys are missing)
            console.log(`No data in ${table}. Checking columns via system query or similar.`);
            // In Supabase/Postgres, we can't easily query information_schema from the client usually, 
            // but we can try to fetch a non-existent column to see the error message if we had access to SQL.
            // Since we can't, let's just assume if it's empty, we might need to insert a dummy.
            console.log(`Wait, I can use the API client to just see what it returns.`);
        }
    }
}

dumpSchema();
