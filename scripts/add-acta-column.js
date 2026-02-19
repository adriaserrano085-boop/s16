
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Try to use service key if available for schema changes? 
// Usually service key is not in .env for frontend. 
// We will try with anon key and hope for the best or assume user runs it.

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumn() {
    console.log('Attempting to add acta_url column to partidos table...');

    // Method 1: Try using RPC if a generic SQL exec function exists (rare but possible in dev envs)
    const { data, error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE partidos ADD COLUMN IF NOT EXISTS acta_url text;'
    });

    if (error) {
        console.error('RPC exec_sql failed (expected if function does not exist):', error.message);

        // Method 2: Instructions
        console.log('\nCannot automatically modify schema with current permissions.');
        console.log('Please run the following SQL in your Supabase Dashboard > SQL Editor:');
        console.log('\nALTER TABLE partidos ADD COLUMN IF NOT EXISTS acta_url text;\n');
    } else {
        console.log('Success! Column added via RPC.');
    }
}

addColumn();
