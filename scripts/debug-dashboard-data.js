
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugData() {
    try {
        console.log('--- EVENTOS ---');
        const { data: eventos, error: eErr } = await supabase.from('eventos').select('*').limit(3);
        if (eErr) console.error('Error fetching eventos:', eErr);
        else console.log(JSON.stringify(eventos, null, 2));

        console.log('\n--- PARTIDOS ---');
        const { data: partidos, error: pErr } = await supabase.from('partidos').select('*').limit(3);
        if (pErr) console.error('Error fetching partidos:', pErr);
        else console.log(JSON.stringify(partidos, null, 2));

        console.log('\n--- ENTRENAMIENTOS ---');
        const { data: entrenamientos, error: tErr } = await supabase.from('entrenamientos').select('*').limit(3);
        if (tErr) console.error('Error fetching entrenamientos:', tErr);
        else console.log(JSON.stringify(entrenamientos, null, 2));
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

debugData();
