
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFinal() {
    console.log("1. Fetching Eventos (with id_eventos)...");
    const { data: eventos, error: eErr } = await supabase
        .from('eventos')
        .select('id, id_eventos, tipo, fecha')
        .eq('tipo', 'Entrenamiento')
        .order('fecha', { ascending: false })
        .limit(20);

    if (eErr) { console.error(eErr); return; }

    const linkIds = eventos.map(e => e.id_eventos).filter(Boolean);
    console.log(`Found ${eventos.length} events. Link IDs count: ${linkIds.length}`);

    console.log("2. Fetching Entrenamientos matching these Link IDs...");
    const { data: trainings, error: tErr } = await supabase
        .from('entrenamientos')
        .select('id_entrenamiento, evento')
        .in('evento', linkIds);

    if (tErr) { console.error(tErr); return; }

    console.log(`Found ${trainings.length} matching trainings.`);

    const trainingMap = {};
    trainings.forEach(t => trainingMap[t.evento] = t);

    const formatted = eventos.filter(e => trainingMap[e.id_eventos]);

    console.log(`3. Final Result Count: ${formatted.length}`);
    if (formatted.length > 0) {
        console.log("Sample:", formatted[0]);
    } else {
        console.log("Still no matches. There might be a deeper data issue.");
    }
}

verifyFinal();
