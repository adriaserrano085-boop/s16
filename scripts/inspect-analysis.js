
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
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAnalysis() {
    console.log('Inspecting analisis_partido...');
    const { data: ap, error: apError } = await supabase.from('analisis_partido').select('*').limit(1);
    if (apError) console.error(apError);
    else {
        console.log('analisis_partido columns:', ap.length > 0 ? Object.keys(ap[0]) : 'Empty table');
        if (ap.length > 0) {
            console.log('Sample raw_json:', JSON.stringify(ap[0].raw_json, null, 2));
        }
    }
}

inspectAnalysis();
