
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
    console.log("Checking constraints for 'asistencia'...");

    // Try to insert a duplicate to see if it fails or if we can query pg_indexes (if allowed)
    // Actually, asking for pg_indexes via rpc or just testing upsert behavior is easier.

    // We'll try to fetch indexes info from pg_indexes if we can, 
    // but often we don't have access to system catalogs.

    // Better: generic probe.
    // Insert item A. Insert item A again. 
    // If table allows duplicates, we have a problem.

    // 1. Get a training and player ID
    const { data: training } = await supabase.from('entrenamientos').select('id_entrenamiento').limit(1);
    const { data: player } = await supabase.from('jugadores_propios').select('id').limit(1);

    if (!training || !player || !training[0] || !player[0]) {
        console.log("Not enough data to test constraints.");
        return;
    }

    const tid = training[0].id_entrenamiento || training[0].id; // Fallback just in case
    const pid = player[0].id;

    console.log(`Testing with Training ${tid}, Player ${pid}`);

    // Cleanup first
    await supabase.from('asistencia').delete().match({ entrenamiento: tid, jugador: pid });

    // Insert 1
    const { error: err1 } = await supabase.from('asistencia').insert({
        entrenamiento: tid,
        jugador: pid,
        asistencia: 'Presente'
    });

    if (err1) console.error("Insert 1 failed:", err1);
    else console.log("Insert 1 success");

    // Insert 2 (Duplicate)
    const { error: err2 } = await supabase.from('asistencia').insert({
        entrenamiento: tid,
        jugador: pid,
        asistencia: 'Ausente'
    });

    if (err2) {
        console.log("Insert 2 failed (Good if constraint exists):", err2.message);
    } else {
        console.log("Insert 2 succeeded (BAD - No Unique Constraint)");
        // Cleanup duplicates
        await supabase.from('asistencia').delete().match({ entrenamiento: tid, jugador: pid });
    }
}

checkConstraints();
