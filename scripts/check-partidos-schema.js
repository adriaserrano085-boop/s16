
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load env vars
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPartidosStructure() {
    const { data, error } = await supabase
        .from('partidos')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Partidos structure (keys):", Object.keys(data[0] || {}));
        if (data[0]) {
            console.log("Sample ID:", data[0].id);
            console.log("Sample Evento:", data[0].Evento); // Check if this exists
            console.log("Sample evento:", data[0].evento); // Check if this exists
        }
    }
}

checkPartidosStructure();
