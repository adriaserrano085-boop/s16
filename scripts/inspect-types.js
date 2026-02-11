import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from .env file in root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectEventTypes() {
    console.log('Fetching events to inspect "tipo" column...');

    const { data, error } = await supabase
        .from('eventos')
        .select('tipo')
        .limit(100);

    if (error) {
        console.error('Error fetching events:', error);
        return;
    }

    if (data && data.length > 0) {
        const types = new Set(data.map(e => e.tipo));
        console.log('Distinct "tipo" values found in DB:', Array.from(types));
        console.log('Sample raw values:', data.slice(0, 5));
    } else {
        console.log('No events found.');
    }
}

inspectEventTypes();
