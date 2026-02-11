
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTrainingRelation() {
    console.log("--- Creating Dummy Event & Training ---");

    // 1. Create Event
    const { data: eventData, error: eventError } = await supabase
        .from('eventos')
        .insert([{
            tipo: 'Entrenamiento', // Changed to 'Entrenamiento' (likely correct case)
            fecha: '2025-01-01',
            hora: '10:00',
            estado: 'Programado'
        }])
        .select();

    if (eventError) {
        console.error("Event Create Error:", eventError);
        return;
    }

    const event = eventData[0];
    const eventId = event.id; // UUID
    const eventIdEventos = event.id_eventos; // Integer/Legacy
    console.log(`Created Event. UUID: ${eventId}, ID_EVENTOS: ${eventIdEventos}`);

    // 2. Try Inserting Training with UUID
    console.log("Attempting insert into entrenamientos with UUID...");
    const { data: trainUUID, error: errorUUID } = await supabase
        .from('entrenamientos')
        .insert([{ evento: eventId, calentamiento: 'Test UUID' }])
        .select();

    if (errorUUID) {
        console.log("Insert with UUID failed:", errorUUID.message);

        // 3. Try Inserting Training with ID_EVENTOS
        console.log("Attempting insert into entrenamientos with ID_EVENTOS...");
        const { data: trainLegacy, error: errorLegacy } = await supabase
            .from('entrenamientos')
            .insert([{ evento: eventIdEventos, calentamiento: 'Test Legacy' }])
            .select();

        if (trainLegacy) {
            console.log("Insert with ID_EVENTOS SUCCESS!");
            console.log("Training Record:", trainLegacy[0]);
        } else {
            console.error("Insert with ID_EVENTOS failed too:", errorLegacy);
        }
    } else {
        console.log("Insert with UUID SUCCESS!");
        console.log("Training Record:", trainUUID[0]);
    }

    // Cleanup
    await supabase.from('eventos').delete().eq('id', eventId);
    console.log("Cleanup done.");
}

checkTrainingRelation();
