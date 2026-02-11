
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncTrainings() {
    console.log("Fetching 'Entrenamiento' events...");
    const { data: events, error: eventError } = await supabase
        .from('eventos')
        .select('id, id_eventos')
        .ilike('tipo', '%entrenamiento%');

    if (eventError) {
        console.error("Error fetching events:", eventError.message);
        return;
    }

    console.log(`Found ${events.length} training events. Checking for existing detail records...`);

    const { data: existing, error: existingError } = await supabase
        .from('entrenamientos')
        .select('evento');

    if (existingError) {
        console.error("Error fetching existing trainings:", existingError.message);
        return;
    }

    const existingIds = new Set(existing.map(e => e.evento));
    const toCreate = events.filter(e => !existingIds.has(e.id_eventos));

    console.log(`${toCreate.length} records need to be created in 'entrenamientos'.`);

    if (toCreate.length === 0) return;

    // Create records
    const records = toCreate.map(e => ({
        evento: e.id_eventos, // Use .id_eventos (integer) as confirmed by previous probe failure with UUID
        calentamiento: 'Sincronizado',
        trabajo_separado: '',
        trabajo_conjunto: '',
        objetivos: ''
    }));

    // Batch insert
    const { error: insertError } = await supabase
        .from('entrenamientos')
        .insert(records);

    if (insertError) {
        console.error("Error creating training records:", insertError.message);
        console.error("Error details:", insertError.details);
    } else {
        console.log("Successfully synchronized training records!");
    }
}

syncTrainings();
