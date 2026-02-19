
import { createClient } from '@supabase/supabase-js';

// Hardcoded for script reliability in this specific debug context
const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugNovDecData() {
    console.log('--- Debugging Nov/Dec 2024 Data ---');

    // 1. Fetch Events
    const { data: events, error: eventsError } = await supabase
        .from('eventos')
        .select('id, tipo, fecha, hora')
        .gte('fecha', '2025-11-01')
        .lte('fecha', '2025-12-31');

    if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return;
    }

    console.log(`Found ${events.length} events in Nov/Dec 2024.`);

    for (const event of events) {
        const fullDate = `${event.fecha} ${event.hora}`;
        // 2. Check for Linked Training/Session
        const { data: trainings, error: trainingError } = await supabase
            .from('entrenamientos')
            .select('id_entrenamiento, evento')
            .eq('evento', event.id);

        if (trainingError) {
            console.error('  Error fetching linked training:', trainingError.message);
            continue;
        }

        if (trainings.length === 0) {
            console.log(`[NO TRAINING] ${event.tipo} (${fullDate}) [ID: ${event.id}]`);
        } else {
            for (const training of trainings) {
                // 3. Check Attendance
                const { data: attendance, error: attError } = await supabase
                    .from('asistencia')
                    .select('id, asistencia')
                    .eq('entrenamiento', training.id_entrenamiento);

                if (attError) {
                    console.error('    Error fetching attendance:', attError.message);
                } else {
                    if (attendance.length > 0) {
                        // Count statuses
                        const counts = attendance.reduce((acc, curr) => {
                            acc[curr.asistencia] = (acc[curr.asistencia] || 0) + 1;
                            return acc;
                        }, {});
                        console.log(`[OK] ${event.tipo} (${fullDate}) -> Attendance: ${attendance.length} records. Stats: ${JSON.stringify(counts)}`);
                    } else {
                        console.log(`[NO ATTENDANCE] ${event.tipo} (${fullDate}) -> Training ID: ${training.id_entrenamiento}`);
                    }
                }
            }
        }
    }
}

debugNovDecData();
