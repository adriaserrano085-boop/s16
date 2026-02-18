
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
    const tables = ['partidos', 'eventos', 'rivales', 'analisis'];
    for (const t of tables) {
        const { data, error } = await supabase.from(t).select('*').limit(1);
        if (error) {
            console.log(`Table ${t} error:`, error.message);
        } else {
            console.log(`Table ${t} exists. Keys:`, data.length > 0 ? Object.keys(data[0]) : 'Empty');
            if (data.length > 0) console.log(`Sample ${t}:`, data[0]);
        }
    }
}

checkTables();
