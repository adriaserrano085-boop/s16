
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
    console.log("Checking for duplicates in 'estadisticas_partido'...");

    const { data, error } = await supabase
        .from('estadisticas_partido')
        .select('id, partido, partido_externo');

    if (error) {
        console.error("Error fetching stats:", error);
        return;
    }

    console.log(`Total records: ${data.length}`);

    const partidoCounts = {};
    const externalCounts = {};

    data.forEach(row => {
        if (row.partido) {
            if (!partidoCounts[row.partido]) partidoCounts[row.partido] = [];
            partidoCounts[row.partido].push(row.id);
        }
        if (row.partido_externo) {
            if (!externalCounts[row.partido_externo]) externalCounts[row.partido_externo] = [];
            externalCounts[row.partido_externo].push(row.id);
        }
    });

    console.log("\n--- Duplicate Check (PARTIDO) ---");
    let dupesFound = false;
    Object.entries(partidoCounts).forEach(([pid, ids]) => {
        if (ids.length > 1) {
            console.log(`Duplicate found for partido ${pid}: IDs [${ids.join(', ')}]`);
            dupesFound = true;
        }
    });
    if (!dupesFound) console.log("No duplicates found for 'partido'.");

    console.log("\n--- Duplicate Check (PARTIDO_EXTERNO) ---");
    dupesFound = false;
    Object.entries(externalCounts).forEach(([pid, ids]) => {
        if (ids.length > 1) {
            console.log(`Duplicate found for partido_externo ${pid}: IDs [${ids.join(', ')}]`);
            dupesFound = true;
        }
    });
    if (!dupesFound) console.log("No duplicates found for 'partido_externo'.");

}

checkDuplicates();
