
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyLogic() {
    console.log("1. Fetching recent training events...");
    const { data: eventos, error: evError } = await supabase
        .from('eventos')
        .select('id, tipo, fecha, hora')
        .eq('tipo', 'Entrenamiento')
        .order('fecha', { ascending: false })
        .limit(20);

    if (evError) { console.error(evError); return; }
    console.log(`Found ${eventos.length} events.`);

    const eventIds = eventos.map(e => e.id);

    console.log("2. Fetching details...");
    const { data: trainings, error: trError } = await supabase
        .from('entrenamientos')
        .select('id_entrenamiento, evento')
        .in('evento', eventIds);

    if (trError) { console.error(trError); return; }

    const trainingMap = {};
    trainings.forEach(t => trainingMap[t.evento] = t);

    const formatted = eventos
        .filter(e => trainingMap[e.id])
        .map(e => ({
            id: trainingMap[e.id].id_entrenamiento,
            date: e.fecha,
            title: e.tipo
        }));

    console.log("3. Resulting list (Top 5):");
    console.table(formatted.slice(0, 5));

    if (formatted.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let closest = formatted[0];
        let minDiff = Math.abs(new Date(formatted[0].date) - today);

        formatted.forEach(e => {
            const diff = Math.abs(new Date(e.date) - today);
            if (diff < minDiff) {
                minDiff = diff;
                closest = e;
            }
        });
        console.log("4. Auto-selected (Closest to today):", closest);
    }
}

verifyLogic();
