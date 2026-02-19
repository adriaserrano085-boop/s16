
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

async function checkLatestActa() {
    console.log('Fetching latest match with acta_url...');

    // Use correct casing from previous inspection: Rival, Evento
    // Assuming 'updated_at' might exist or fallback to id desc
    // Actually, 'updated_at' might not be in 'partidos', check schema?
    // Let's rely on 'id' descending to get the latest created/processed one if updated_at is missing.

    const { data, error } = await supabase
        .from('partidos')
        .select('id, Rival, acta_url') // Select columns we know exist
        .not('acta_url', 'is', null)
        .order('id', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Latest match with acta:', data[0]);
    } else {
        console.log('No matches found with acta_url.');
    }
}

checkLatestActa();
