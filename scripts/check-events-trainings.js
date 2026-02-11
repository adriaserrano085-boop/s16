import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEventsAndTrainings() {
    // Check eventos that are trainings
    console.log('Checking eventos (training events)...');
    const { data: eventos, error: eventosError } = await supabase
        .from('eventos')
        .select('*')
        .limit(10);

    if (eventosError) {
        console.error('Error:', eventosError);
    } else {
        console.log(`Total eventos: ${eventos.length}`);

        // Filter training events
        const trainingEvents = eventos.filter(e => {
            const tipo = e.Tipo || e.tipo || e.Tipo_evento || '';
            return tipo.toLowerCase().includes('entrenamiento') || tipo.toLowerCase().includes('training');
        });

        console.log(`Training eventos: ${trainingEvents.length}`);

        if (trainingEvents.length > 0) {
            console.log('\nSample training event:');
            console.log(trainingEvents[0]);
        }
    }

    // Check entrenamientos table structure
    console.log('\n\nChecking entrenamientos table...');
    const { data: trainings, error: trainingsError } = await supabase
        .from('entrenamientos')
        .select('*')
        .limit(1);

    if (trainingsError) {
        console.error('Error:', trainingsError);
    } else {
        console.log(`Entrenamientos count: ${trainings.length}`);
        if (trainings.length > 0) {
            console.log('Columns:', Object.keys(trainings[0]));
        }
    }
}

checkEventsAndTrainings();
