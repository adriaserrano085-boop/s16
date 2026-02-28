
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable(tableName) {
    console.log(`\n--- Inspecting table: ${tableName} ---`);
    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

    if (error) {
        console.error(`Error inspecting ${tableName}:`, error);
    } else {
        if (data.length > 0) {
            console.log(`Columns in ${tableName}:`, Object.keys(data[0]));
            // console.log('Sample record:', data[0]);
        } else {
            console.log(`Table ${tableName} is empty or not found.`);
        }
    }
}

async function listAllTables() {
    console.log('\n--- Listing all tables in public schema ---');
    const { data, error } = await supabase
        .rpc('get_tables'); // This might not work if RPC is not defined

    if (error) {
        // Fallback: try to select from information_schema if possible, but anonym key usually prevents this.
        // Instead, let's just try common variations.
        console.log('RPC get_tables failed. Trying manual variations...');
        const variations = ['jugadores_propios', 'JugadoresPropios', 'familias', 'Familias', 'Staff', 'staff', 'users', 'Users'];
        for (const v of variations) {
            await inspectTable(v);
        }
    } else {
        console.log('Tables:', data);
    }
}

async function run() {
    await listAllTables();
}

run();
