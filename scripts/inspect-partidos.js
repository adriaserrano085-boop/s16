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

async function inspectPartidosSchema() {
    console.log('Fetching one record from "partidos" to inspect columns...');

    const { data, error } = await supabase
        .from('partidos')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching partidos:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns in "partidos":', Object.keys(data[0]));
        console.log('Sample record:', data[0]);
    } else {
        // If table is empty, we might not get keys from data. 
        // We can try to insert a dummy to get a schema error or just rely on previous knowledge/inference.
        // Or we can try to get the definition via RPC if available, but let's hope for at least one record.
        console.log('No records found in "partidos" to inspect keys directly.');
    }
}

inspectPartidosSchema();
