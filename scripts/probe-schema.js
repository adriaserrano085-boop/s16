
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probeTables() {
    console.log("--- Probing 'entrenamientos' ---");
    // Try to insert an empty object to see what defaults/columns return, or what errors occur.
    // We need a valid 'evento' ForeignKey first? Likely.

    // 1. Create a dummy event
    const { data: eventData, error: eventError } = await supabase
        .from('eventos')
        .insert([{
            tipo: 'Entrenamiento',
            fecha: '2025-01-01',
            hora: '12:00',
            estado: 'Programado' // Try 'Programado' or NULL if allowed. Sample was 'Finalizado'.
        }])
        .select();

    if (eventError) {
        console.error("Failed to create probe event:", eventError);
        return;
    }
    const eventId = eventData[0].id_eventos || eventData[0].id; // Handle likely PK
    console.log("Created probe event:", eventId);

    // 2. Try to insert into entrenamientos linked to this event
    const { data: trainData, error: trainError } = await supabase
        .from('entrenamientos')
        .insert([{ evento: eventId }]) // minimal insert
        .select();

    if (trainData) {
        console.log("Entrenamientos Columns:", Object.keys(trainData[0]));
        console.log("Entrenamientos Data:", trainData[0]);
    } else {
        console.error("Entrenamientos Insert Error:", trainError);
    }

    // 3. Clean up
    await supabase.from('eventos').delete().eq('id_eventos', eventId); // or id
    console.log("Cleaned up probe event.");

    console.log("\n--- Re-verifying 'partidos' ---");
    const { data: matchData, error: matchError } = await supabase.from('partidos').select('*').limit(1);
    if (matchData && matchData.length > 0) {
        console.log("Partidos Columns:", Object.keys(matchData[0]));
    }
}

probeTables();
