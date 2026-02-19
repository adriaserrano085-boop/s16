
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkStaffSchema() {
    console.log("Checking staff table schema...");

    // We can't direct inspect schema easily, but we can try to select * from it
    // and see the keys of the returned object.
    const { data, error } = await supabase
        .from('Staff')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching staff:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Found staff record keys:", Object.keys(data[0]));
        console.log("Sample record:", data[0]);
    } else {
        console.log("Staff table is empty. Attempting to insert a dummy to check schema or relying on 'Usuario' convention.");
        // If empty, we assume 'Usuario' exists based on user's comment "vinculado a un registro de la tabla Staff"
        // Let's try to select 'Usuario' specifically to see if it errors.
        const { error: colError } = await supabase.from('staff').select('Usuario').limit(1);
        if (colError) {
            console.log("Column 'Usuario' might not exist:", colError.message);
        } else {
            console.log("Column 'Usuario' likely exists (no error selection).");
        }
    }
}

checkStaffSchema();
