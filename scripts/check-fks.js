
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFKs() {
    console.log("Checking foreign keys for 'asistencia'...");

    // We can't query information_schema directly via PostgREST easily without a custom RPC.
    // But we can try to "guess" by joining.

    console.log("\nTrying to join with 'eventos'...");
    const { data: joinEventos, error: errEventos } = await supabase
        .from('asistencia')
        .select(`
            id,
            entrenamiento:eventos ( id, tipo )
        `)
        .limit(1);

    if (errEventos) console.log("Join with 'eventos' failed:", errEventos.message);
    else console.log("Join with 'eventos' succeeded!");

    console.log("\nTrying to join with 'entrenamientos'...");
    const { data: joinEnt, error: errEnt } = await supabase
        .from('asistencia')
        .select(`
            id,
            entrenamiento:entrenamientos ( id )
        `)
        .limit(1);

    if (errEnt) console.log("Join with 'entrenamientos' failed:", errEnt.message);
    else console.log("Join with 'entrenamientos' succeeded!");
}

checkFKs();
