
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkYellowCards() {
    console.log('Checking players with yellow cards...');
    const { data, error } = await supabase
        .from('estadisticas_jugador')
        .select('nombre, tarjetas_amarillas, tarjetas_rojas, partido')
        .gt('tarjetas_amarillas', 0);

    if (error) {
        console.error('Error fetching yellow cards:', error);
    } else {
        console.log(`Found ${data.length} records with yellow cards:`);
        console.table(data);
    }

    console.log('Checking raw event types in actas parsed text (if stored? No, parsed on fly).');
    console.log('Checking unique event types if any saved... actually events are not stored directly, only aggregated stats.');
}

checkYellowCards();
