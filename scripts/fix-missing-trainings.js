
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMissingTrainings() {
    console.log("Starting fix for missing training records...");

    // 1. Get all events
    const { data: events, error: eventsError } = await supabase
        .from('eventos')
        .select('*');

    if (eventsError) {
        console.error("Error fetching events:", eventsError);
        return;
    }

    console.log(`Found ${events.length} events.`);

    // 2. Filter for training events
    const trainingEvents = events.filter(e => {
        const type = (e.tipo || e.Tipo || '').toLowerCase();
        return type.includes('entrenamiento') || type.includes('training');
    });

    console.log(`Found ${trainingEvents.length} training events.`);

    // 3. Check each training event for a corresponding record in 'entrenamientos'
    for (const ev of trainingEvents) {
        // Check by UUID (evento column)
        const { data: training, error: trainingError } = await supabase
            .from('entrenamientos')
            .select('*')
            .eq('evento', ev.id)
            .maybeSingle();

        // Also check legacy ID if available
        let legacyTraining = null;
        if (!training && ev.id_eventos) {
            const { data: lt } = await supabase
                .from('entrenamientos')
                .select('*')
                .eq('evento', ev.id_eventos)
                .maybeSingle();
            legacyTraining = lt;
        }

        if (!training && !legacyTraining) {
            console.log(`Missing training record for event ${ev.id} (${ev.tipo}). Creating one...`);

            // Use the UUID for the link
            const { error: createError } = await supabase
                .from('entrenamientos')
                .insert({
                    evento: ev.id, // Use UUID
                    calentamiento: 'No especificado',
                    trabajo_separado: 'No especificado',
                    trabajo_conjunto: 'No especificado',
                    objetivos: ev.observaciones
                });

            if (createError) {
                console.error(`Failed to create training for event ${ev.id}:`, createError);
            } else {
                console.log(`Successfully created training record for event ${ev.id}`);
            }
        } else {
            console.log(`Event ${ev.id} already has a training record.`);
        }
    }

    console.log("Fix script completed.");
}

fixMissingTrainings();
