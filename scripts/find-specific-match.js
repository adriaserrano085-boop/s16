
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findSpecificMatch() {
    // Get all rivals to find Santboiana ID
    const { data: rivals } = await supabase.from('rivales').select('*').ilike('nombre_equipo', '%Santboiana%');
    console.log('Rivals found:', rivals);

    if (rivals && rivals.length > 0) {
        const rivalIds = rivals.map(r => r.id_equipo);

        // Find matches with these rivals
        const { data: matches, error } = await supabase
            .from('partidos')
            .select(`
            id, 
            marcador_local, 
            marcador_visitante, 
            Evento (id, fecha),
            Rival
        `)
            .in('Rival', rivalIds);

        if (error) {
            console.error('Error searching matches:', error);
        } else {
            console.log('Matches against Santboiana:', JSON.stringify(matches, null, 2));
            // Filter by score
            const target = matches.find(m =>
                (m.marcador_local === 7 && m.marcador_visitante === 69) ||
                (m.marcador_local === 69 && m.marcador_visitante === 7)
            );
            if (target) {
                console.log('FOUND TARGET MATCH:', target);
            } else {
                console.log('No exact score match found. Checking close matches...');
            }
        }
    } else {
        console.log('No rival named Santboiana found. Listing all rivals...');
        const { data: allRivals } = await supabase.from('rivales').select('id_equipo, nombre_equipo');
        console.log(allRivals);
    }
}

findSpecificMatch();
