
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

async function verifyColumn() {
    console.log("Verifying 'raw_json' column in 'analisis_partido'...");

    // Try to select the column
    const { data, error } = await supabase
        .from('analisis_partido')
        .select('raw_json')
        .limit(1);

    if (error) {
        console.error("Error/Column missing:", error.message);
    } else {
        console.log("SUCCESS: Column 'raw_json' exists!");
    }
}

verifyColumn();
