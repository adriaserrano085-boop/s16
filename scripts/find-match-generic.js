
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findMatchGeneric() {
    console.log('Searching for matches with score 7-69 or 69-7...');

    // Check 'partidos'
    const { data: matches, error } = await supabase
        .from('partidos')
        .select('*, Evento(*), Rival(*)')
        .or('and(marcador_local.eq.7,marcador_visitante.eq.69),and(marcador_local.eq.69,marcador_visitante.eq.7)');

    if (matches && matches.length > 0) {
        console.log('Found in partidos:', matches);
    } else {
        console.log('Not found in partidos. Checking for external matches table...');
    }

    // Check valid table names again to find external matches
    // Since I can't list tables easily, I'll try to select from 'partidos_externos'
    const { data: extMatches, error: extError } = await supabase
        .from('partidos_externos')
        .select('*')
        .limit(5);

    if (!extError) {
        console.log('partidos_externos exists:', extMatches);
        const { data: targetExt } = await supabase
            .from('partidos_externos')
            .select('*')
            .or('and(marcador_local.eq.7,marcador_visitante.eq.69),and(marcador_local.eq.69,marcador_visitante.eq.7)');
        if (targetExt && targetExt.length > 0) {
            console.log('Found in partidos_externos:', targetExt);
        }
    } else {
        console.log('partidos_externos likely does not exist or error:', extError.message);
    }
}

findMatchGeneric();
