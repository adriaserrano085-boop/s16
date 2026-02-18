
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
// Using service key if available would be best, but user probably only has Anon Key.
// If user has service role key in .env, I should use it. 
// But checking the file content earlier, I only saw Anon key.

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
    console.log("Checking if column 'raw_json' exists...");

    // Check by trying to select it
    const { data, error } = await supabase
        .from('analisis_partido')
        .select('raw_json')
        .limit(1);

    if (error) {
        if (error.message.includes('column "raw_json" does not exist')) {
            console.log("Column missing. PLEASE RUN THE FOLLOWING SQL:");
            console.log("ALTER TABLE analisis_partido ADD COLUMN IF NOT EXISTS raw_json JSONB;");

            // Try to create it via RPC if exec_sql function exists (common pattern)
            const { error: rpcError } = await supabase.rpc('exec_sql', {
                query: "ALTER TABLE analisis_partido ADD COLUMN IF NOT EXISTS raw_json JSONB;"
            });

            if (rpcError) {
                console.log("Could not run via RPC either. User action required.");
            } else {
                console.log("Successfully added column via RPC!");
            }
        } else {
            console.error("Unknown error checking column:", error);
        }
    } else {
        console.log("Column 'raw_json' ALREADY EXISTS.");
    }
}

runSQL();
