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
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectMatchDetails() {
    console.log('--- Inspecting PARTIDOS ---');
    const { data: partidos, error: errorPartidos } = await supabase
        .from('partidos')
        .select('*')
        .limit(2);

    if (errorPartidos) {
        console.error('Error fetching partidos:', errorPartidos);
    } else if (partidos && partidos.length > 0) {
        console.log('Partidos Columns:', Object.keys(partidos[0]));
        console.log('Sample Partido:', JSON.stringify(partidos[0], null, 2));
    } else {
        console.log('No matches found.');
    }

    console.log('\n--- Inspecting RIVALES ---');
    const { data: rivales, error: errorRivales } = await supabase
        .from('rivales')
        .select('*')
        .limit(2);

    if (errorRivales) {
        console.error('Error fetching rivales:', errorRivales);
    } else if (rivales && rivales.length > 0) {
        console.log('Rivales Columns:', Object.keys(rivales[0]));
        console.log('Sample Rival:', JSON.stringify(rivales[0], null, 2));
    } else {
        console.log('No rivals found.');
    }
}

inspectMatchDetails();
