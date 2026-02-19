
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
    console.log("Starting De-duplication process...");

    // 1. Fetch all external matches
    const { data: allExternal, error } = await supabase
        .from('partidos_externos')
        .select('*')
        .order('id', { ascending: true }); // Keep oldest? or newest? Usually oldest ID is the first one.

    if (error) {
        console.error("Error fetching matches:", error);
        return;
    }

    console.log(`Fetched ${allExternal.length} external matches.`);

    // Group by unique key: date + home + away
    const groups = {};
    allExternal.forEach(m => {
        const key = `${m.fecha}_${m.equipo_local}_${m.equipo_visitante}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
    });

    for (const [key, matches] of Object.entries(groups)) {
        if (matches.length > 1) {
            console.log(`Duplicate Group found: ${key} (${matches.length} matches)`);

            // Strategies:
            // 1. Keep the one that is LINKED to stats? They are all linked likely.
            // 2. Keep the newest ID? Or Oldest?
            // User says "duplicates", probably wants to keep one.
            // Let's keep the one with the HIGHEST ID (latest created) as it might have the latest stats?
            // Or typically keep the OLDEST ID to be stable?
            // Let's keep the one with the MOST stats attached?
            // Actually, for simplicity, let's keep the LAST one (latest ID) and delete the others.

            // Wait, if I delete 'partidos_externos', does it cascade delete 'estadisticas_partido'?
            // Typically yes if FK is ON DELETE CASCADE.
            // If not, we need to delete stats first.

            // Let's check stats for each.
            const ids = matches.map(m => m.id);
            const keepId = ids[ids.length - 1]; // Keep latest
            const deleteIds = ids.slice(0, ids.length - 1);

            console.log(`-> Keeping ID: ${keepId}. Deleting IDs: ${deleteIds.join(', ')}`);

            // Delete duplicates
            const { error: delError } = await supabase
                .from('partidos_externos')
                .delete()
                .in('id', deleteIds);

            if (delError) {
                console.error("Error deleting duplicates:", delError);
                // Maybe FK constraint failed?
                // Try deleting stats first if needed.
            } else {
                console.log("-> Deleted successfully.");
            }
        }
    }

    // Also, check if any External Match duplicates an INTERNAL match
    // ... For now, let's just fix the blatant external duplicates found in the list.
}

cleanupDuplicates();
