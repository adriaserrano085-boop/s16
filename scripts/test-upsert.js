
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load env vars
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
    console.log("Checking DB constraints (via logic test)...");

    // 1. Create a dummy event ID
    const dummyEventId = 999999;

    // 2. Insert first record
    console.log("Inserting Record A...");
    const { data: a, error: e1 } = await supabase
        .from('analisis_partido')
        .upsert({
            evento_id: dummyEventId,
            analyst_report: "Test A"
        }, { onConflict: 'evento_id' })
        .select();

    if (e1) console.error("Error A:", e1);
    else console.log("Record A inserted:", a[0].id);

    // 3. Insert second record with SAME event ID (should update)
    console.log("Inserting Record B (Update)...");
    const { data: b, error: e2 } = await supabase
        .from('analisis_partido')
        .upsert({
            evento_id: dummyEventId,
            analyst_report: "Test B (Updated)"
        }, { onConflict: 'evento_id' })
        .select();

    if (e2) {
        console.error("Error B:", e2);
        if (e2.message.includes('constraint')) {
            console.log("Constraint might be missing or onConflict param is wrong.");
        }
    } else {
        console.log("Record B processed:", b[0].id);
        if (a[0].id === b[0].id) {
            console.log("SUCCESS: ID matches. Upsert worked (Update).");
        } else {
            console.log("FAILURE: ID mismatch. New row created (Insert). Constraint missing?");
        }
    }

    // Cleanup
    await supabase.from('analisis_partido').delete().eq('evento_id', dummyEventId);
}

checkConstraints();
