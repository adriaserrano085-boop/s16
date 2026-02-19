
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStaffColumn() {
    console.log('--- Checking Staff Table Column "Usuario" ---');
    // We select 'Usuario' specifically. If it doesn't exist, Supabase should throw an error.
    const { data, error } = await supabase.from('staff').select('Usuario').limit(1);

    if (error) {
        console.error('Error selecting Usuario from staff:', error);
        if (error.code === 'PGRST205') {
            console.log('CONFIRMED: Column likely does not exist or table issue.');
        }
    } else {
        console.log('Success: Column "Usuario" likely exists (query executed without structure error).');
        console.log('Data:', data);
    }
}

checkStaffColumn();
