
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load env vars manually
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listMatches() {
    console.log("Fetching some match events...");

    const { data, error } = await supabase
        .from('eventos')
        .select(`
            id, 
            tipo, 
            fecha, 
            partidos (
                id, 
                Rival
            )
        `)
        .eq('tipo', 'Partido')
        .limit(10);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

listMatches();
