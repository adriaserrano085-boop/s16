
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log("Checking 'analisis_partido' columns...");

    // Attempt to select specific columns to see if they exist
    const { data, error } = await supabase
        .from('analisis_partido')
        .select('id, analyst_report, raw_json')
        .limit(1);

    if (error) {
        console.error("Error selecting columns:", error.message);
        if (error.code === 'PGRST204') {
            console.log("CONFIRMED: One or more columns are missing.");
        }
    } else {
        console.log("Success! Columns exist.");
        if (data.length > 0) {
            console.log("Row data:", data[0]);
        } else {
            console.log("Table is empty, but columns exist.");
        }
    }

    // Also check standard select *
    const { data: allData, error: allError } = await supabase
        .from('analisis_partido')
        .select('*')
        .limit(1);

    if (allData && allData.length > 0) {
        console.log("Available columns:", Object.keys(allData[0]));
    }
}

checkColumns();
