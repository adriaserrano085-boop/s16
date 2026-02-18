
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findMatch() {
    const { data: matches, error } = await supabase
        .from('eventos')
        .select('*')
        .ilike('tipo', 'partido')
        .limit(1);

    if (error) {
        console.error('Error fetching matches:', error);
        return;
    }

    if (matches.length > 0) {
        console.log('Sample match keys:', Object.keys(matches[0]));
        console.log('Sample match:', matches[0]);
    } else {
        console.log('No matches found.');
    }
}

findMatch();
