import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetTrainings() {
    console.log('=== RESETTING ENTRENAMIENTOS TABLE ===\n');

    // Step 1: Get count before deletion
    const { count: beforeCount } = await supabase
        .from('entrenamientos')
        .select('*', { count: 'exact', head: true });

    console.log(`Current entrenamientos count: ${beforeCount}\n`);

    // Step 2: Delete all existing entrenamientos
    console.log('Step 1: Deleting all existing entrenamientos...');

    // Get all IDs first
    const { data: allTrainings } = await supabase
        .from('entrenamientos')
        .select('id_entrenamiento');

    if (allTrainings && allTrainings.length > 0) {
        const ids = allTrainings.map(t => t.id_entrenamiento);
        const { error: deleteError } = await supabase
            .from('entrenamientos')
            .delete()
            .in('id_entrenamiento', ids);

        if (deleteError) {
            console.error('❌ Error deleting entrenamientos:', deleteError.message);
            return;
        }
        console.log(`✅ Deleted ${allTrainings.length} entrenamientos\n`);
    } else {
        console.log('✅ Table already empty\n');
    }

    // Step 3: Get all training events from eventos
    console.log('Step 2: Fetching training events from eventos...');
    const { data: eventos, error: eventosError } = await supabase
        .from('eventos')
        .select('id_eventos, tipo, fecha, hora')
        .order('fecha', { ascending: false });

    if (eventosError) {
        console.error('❌ Error fetching eventos:', eventosError.message);
        return;
    }

    // Filter for training events
    const trainingEvents = eventos.filter(e => {
        const tipo = e.tipo || '';
        return tipo.toLowerCase().includes('entrenamiento') || tipo.toLowerCase().includes('training');
    });

    console.log(`✅ Found ${trainingEvents.length} training events out of ${eventos.length} total eventos\n`);

    if (trainingEvents.length === 0) {
        console.log('⚠️ No training events found. Nothing to create.');
        return;
    }

    // Step 4: Create one entrenamiento per training event
    console.log('Step 3: Creating entrenamientos...');

    const newTrainings = trainingEvents.map(event => ({
        evento: event.id_eventos
        // equipo and trabajo_separado will use default values or be null
    }));

    const { data: created, error: createError } = await supabase
        .from('entrenamientos')
        .insert(newTrainings)
        .select();

    if (createError) {
        console.error('❌ Error creating entrenamientos:', createError.message);
        console.error('Details:', createError);
        return;
    }

    console.log(`✅ Created ${created.length} entrenamientos\n`);

    console.log('\n=== RESET COMPLETE ===');
    console.log(`Deleted: ${beforeCount || 0} entrenamientos`);
    console.log(`Created: ${created.length} entrenamientos`);
    console.log('\nSample of first 3 created:');
    created.slice(0, 3).forEach((t, idx) => {
        console.log(`  ${idx + 1}. Training ID: ${t.id_entrenamiento}, Event ID: ${t.evento}`);
    });
}

resetTrainings();
