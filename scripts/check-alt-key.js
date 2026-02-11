
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAltKey() {
    console.log("Fetching 5 recent entrenamientos...");
    const { data: trainings } = await supabase.from('entrenamientos').select('evento').limit(5);
    const trainEventFKs = trainings.map(t => t.evento);

    console.log("Sample Entrenamientos.evento:", trainEventFKs[0]);

    console.log("Fetching 5 events...");
    const { data: events } = await supabase.from('eventos').select('id, id_eventos').limit(5);

    console.log("Sample Eventos.id:", events[0].id);
    console.log("Sample Eventos.id_eventos:", events[0].id_eventos);

    // Check if training FK matches id_eventos
    console.log("Checking for matches on id_eventos...");
    const { data: matchTest, error } = await supabase
        .from('eventos')
        .select('id, id_eventos')
        .in('id_eventos', trainEventFKs);

    if (error) console.error(error);
    console.log("Matches on id_eventos:", matchTest ? matchTest.length : 0);
}

checkAltKey();
