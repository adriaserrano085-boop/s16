import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('--- Inspecting Eventos Keys ---');
    const { data: events, error: evErr } = await supabase.from('eventos').select('*').limit(1);
    if (events && events.length > 0) {
        console.log('Event Keys:', Object.keys(events[0]));
    } else {
        console.log('No events found or error:', evErr);
    }

    console.log('\n--- Finding Match with Non-Null Evento ---');
    const { data: matches, error: mErr } = await supabase
        .from('partidos')
        .select('id, Evento')
        .not('Evento', 'is', null)
        .limit(1);

    if (matches && matches.length > 0) {
        console.log('Found Linked Match:', matches[0]);
        console.log('Type of Evento:', typeof matches[0].Evento);
    } else {
        console.log('No matches with Evento set found (or error):', mErr);
    }
}

inspectSchema();
