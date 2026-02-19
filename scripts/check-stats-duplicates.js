
import { supabase } from '../src/lib/supabaseClient.js';

async function checkDuplicates() {
    console.log("Checking for duplicates in 'estadisticas_partido'...");

    const { data, error } = await supabase
        .from('estadisticas_partido')
        .select('id, partido, partido_externo, created_at');

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
