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

async function debugMatchLinking() {
    console.log('Fetching Matches and Rivals...');

    const { data: matches, error: matchError } = await supabase.from('partidos').select('*');
    const { data: rivals, error: rivalError } = await supabase.from('rivales').select('*');

    if (matchError || rivalError) {
        console.error('Error fetching data:', matchError || rivalError);
        return;
    }

    console.log(`Loaded ${matches.length} matches and ${rivals.length} rivals.`);

    // Simulate frontend logic
    matches.forEach(match => {
        // Frontend logic: const rival = rivalData?.find(r => r.id_equipo == matchRecord.Rival);
        const rival = rivals.find(r => r.id_equipo == match.Rival);

        if (rival) {
            console.log(`[MATCH ${match.id}] Linked to Rival: ${rival.nombre_equipo}`);
            console.log(`   -> Match Rival ID: ${match.Rival}`);
            console.log(`   -> Rival ID:       ${rival.id_equipo}`);
            console.log(`   -> Rival Shield:   ${rival.escudo ? 'PRESENT' : 'MISSING'}`);
            if (rival.escudo) console.log(`   -> URL: ${rival.escudo}`);
        } else {
            console.log(`[MATCH ${match.id}] Failed to link!`);
            console.log(`   -> Match Rival ID: ${match.Rival} (Type: ${typeof match.Rival})`);
            // Check if it exists in rivals manually
            const manualCheck = rivals.find(r => r.id_equipo === match.Rival);
            if (manualCheck) console.log("   -> WEIRD: Strict equality found it, but loose didn't?");
        }
        console.log('--------------------------------------------------');
    });
}

debugMatchLinking();
