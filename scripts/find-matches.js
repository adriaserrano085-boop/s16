
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findMatches() {
    // 1. Fetch a bunch of Eventos
    const { data: eventos } = await supabase.from('eventos').select('id, tipo, fecha').limit(100);
    const evIds = new Set(eventos.map(e => e.id));

    // 2. Fetch a bunch of Entrenamientos
    const { data: trainings } = await supabase.from('entrenamientos').select('id_entrenamiento, evento').limit(100);

    // 3. Find matches
    let matches = 0;
    const trainingIdsWithEvents = [];

    trainings.forEach(t => {
        if (evIds.has(t.evento)) {
            matches++;
            trainingIdsWithEvents.push(t.evento);
        }
    });

    console.log(`checked 100 events and 100 trainings.`);
    console.log(`Matches found (trainings pointing to fetched events): ${matches}`);

    if (matches > 0) {
        console.log("Sample Match:", trainingIdsWithEvents[0]);
    } else {
        console.log("No overlap in first 100 rows of each.");
        // Try query strategy: Fetch events that ARE in the training list?
        const trainingEventIds = trainings.map(t => t.evento);
        const { data: specificEvents } = await supabase.from('eventos').select('id').in('id', trainingEventIds);
        console.log(`Querying events for the 100 trainings returned: ${specificEvents.length} matches.`);
    }
}

findMatches();
