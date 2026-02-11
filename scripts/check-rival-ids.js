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

async function checkRivalIds() {
    console.log('Fetching all rivals...');
    const { data: rivales, error: errRivales } = await supabase.from('rivales').select('id_equipo, nombre_equipo');

    if (errRivales) {
        console.error('Error fetching rivals:', errRivales);
        return;
    }

    const rivalIds = new Set(rivales.map(r => r.id_equipo));
    console.log(`Found ${rivales.length} rivals.`);

    console.log('Fetching all matches (partidos)...');
    const { data: partidos, error: errPartidos } = await supabase.from('partidos').select('id, Rival');

    if (errPartidos) {
        console.error('Error fetching matches:', errPartidos);
        return;
    }

    console.log(`Found ${partidos.length} matches.`);

    let invalidCount = 0;
    partidos.forEach(p => {
        if (p.Rival && !rivalIds.has(p.Rival)) {
            console.log(`Mismatch! Match ${p.id} has Rival ID ${p.Rival} which is NOT in rivales table.`);
            invalidCount++;
        }
    });

    if (invalidCount === 0) {
        console.log('All match Rival IDs are valid.');
    } else {
        console.log(`Found ${invalidCount} invalid Rival IDs.`);
    }
}

checkRivalIds();
