
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugData() {
    try {
        console.log('--- RIVALES ---');
        const { data: rivales, error: rErr } = await supabase.from('rivales').select('*').limit(3);
        if (rErr) console.error('Error fetching rivales:', rErr);
        else console.log(JSON.stringify(rivales, null, 2));

        console.log('\n--- JUGADORES ---');
        const { data: jugadores, error: jErr } = await supabase.from('jugadores_propios').select('*').limit(3);
        if (jErr) console.error('Error fetching jugadores:', jErr);
        else console.log(JSON.stringify(jugadores, null, 2));
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

debugData();
