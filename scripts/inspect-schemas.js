
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

async function inspectSchema() {
    console.log('Inspecting estadisticas_partido...');
    const { data: ep, error: epError } = await supabase.from('estadisticas_partido').select('*').limit(1);
    if (epError) console.error(epError);
    else console.log('estadisticas_partido columns:', ep.length > 0 ? Object.keys(ep[0]) : 'Empty table');
}

inspectSchema();
