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

async function checkUniqueMatchLinks() {
    console.log('Checking for duplicate Evento keys in partidos...');
    const { data: matches, error: matchError } = await supabase.from('partidos').select('id, Evento');

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
    else console.log(`Found ${matchViolations} violations.`);
}

checkUniqueMatchLinks();
