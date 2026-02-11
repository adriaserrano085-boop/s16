
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecent() {
    // Fetch most recent trainings (assuming strictly higher ID or created_at if exists, but we saw created_en)
    // The previous output of columns showed 'creado_en'.

    console.log("Fetching 5 most recent entrenamientos...");
    const { data: trainings, error: tErr } = await supabase
        .from('entrenamientos')
        .select('id_entrenamiento, evento, creado_en')
        .order('creado_en', { ascending: false })
        .limit(5);

    if (tErr) { console.error(tErr); return; }
    console.log("Trainings:", trainings);

    if (trainings.length > 0) {
        const evIds = trainings.map(t => t.evento);
        console.log("Checking if these events exist...");
        const { data: events, error: eErr } = await supabase
            .from('eventos')
            .select('id, tipo, fecha')
            .in('id', evIds);

        if (eErr) console.error(eErr);
        console.log("Found Events:", events);
    }
}

checkRecent();
