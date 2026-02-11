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

async function checkUniqueIds() {
    console.log('Checking for duplicate id_eventos in eventos...');
    const { data: events, error } = await supabase.from('eventos').select('id, id_eventos, tipo');

    if (error) {
        console.error(error);
        return;
    }

    const legacyIdCounts = {};
    events.forEach(e => {
        if (e.id_eventos) {
            if (!legacyIdCounts[e.id_eventos]) legacyIdCounts[e.id_eventos] = [];
            legacyIdCounts[e.id_eventos].push(e.id);
        }
    });

    let violations = 0;
    Object.keys(legacyIdCounts).forEach(legacyId => {
        if (legacyIdCounts[legacyId].length > 1) {
            console.log(`Duplicate id_eventos: ${legacyId} shared by ${legacyIdCounts[legacyId].length} events.`);
            violations++;
        }
    });

    if (violations === 0) console.log('No duplicate id_eventos found.');

    console.log('\nChecking for duplicate Evento keys in partidos...');
    const { data: matches, error: matchError } = await supabase.from('partidos').select('id, Evento, Rival');

    if (matchError) {
        console.error(matchError);
        return;
    }

    const matchEventCounts = {};
    matches.forEach(m => {
        if (m.Evento) {
            if (!matchEventCounts[m.Evento]) matchEventCounts[m.Evento] = [];
            matchEventCounts[m.Evento].push(m.id);
        }
    });

    let matchViolations = 0;
    Object.keys(matchEventCounts).forEach(eventId => {
        if (matchEventCounts[eventId].length > 1) {
            console.log(`Multiple matches linked to same Evento ID: ${eventId} (Matches: ${matchEventCounts[eventId].join(', ')})`);
            matchViolations++;
        }
    });

    if (matchViolations === 0) console.log('No matches linked to the same event found.');
}

checkUniqueIds();
