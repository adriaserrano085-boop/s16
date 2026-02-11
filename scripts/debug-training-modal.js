
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTrainingModalLogic() {
    console.log('--- Debugging Training Modal Logic ---');

    // 0. Check Players
    console.log("0. Fetching players...");
    const { data: players, error: playersError } = await supabase.from('jugadores_propios').select('*').limit(5);
    if (playersError) console.error('Error fetching players:', playersError);
    else console.log(`Found ${players?.length} players.`);

    // 1. Find a PAST recent training event
    console.log("1. Fetching a recent PAST training event...");
    const now = new Date().toISOString();
    const { data: events, error: eventsError } = await supabase
        .from('eventos')
        .select('*')
        .lt('fecha', now) // Less than now
        .order('fecha', { ascending: false })
        .limit(20);

    if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return;
    }

    // Filter for training
    const trainingEvent = events.find(e => {
        const type = (e.tipo || e.Tipo || '').toLowerCase();
        return type.includes('entrenamiento') || type.includes('training');
    });

    if (!trainingEvent) {
        console.error('No training event found in the last 20 events.');
        return;
    }

    console.log(`Found Training Event: ID=${trainingEvent.id}, Date=${trainingEvent.fecha}, Type=${trainingEvent.tipo}`);

    // 2. Try to find the training record (entrenamientos table)
    console.log(`2. Looking for 'entrenamientos' record where evento = ${trainingEvent.id}...`);

    // Check what columns 'entrenamientos' has first just in case
    // But assuming 'evento' based on previous context.

    const { data: trainingData, error: trainingError } = await supabase
        .from('entrenamientos')
        .select('*')
        .eq('evento', trainingEvent.id);

    if (trainingError) {
        console.error('Error fetching training record:', trainingError);
        return;
    }

    if (!trainingData || trainingData.length === 0) {
        console.error('❌ No training record found for this event ID.');
        console.log('This explains why attendance is not showing. The link is broken or missing.');
    } else {
        console.log(`✅ Found ${trainingData.length} training records.`);
        const trainingRecord = trainingData[0];
        console.log(`Training ID: ${trainingRecord.id_entrenamiento}`);

        // 3. Fetch Attendance
        console.log(`3. Fetching attendance for training ID: ${trainingRecord.id_entrenamiento}...`);
        const { data: attendance, error: attendanceError } = await supabase
            .from('asistencia')
            .select('*')
            .eq('entrenamiento', trainingRecord.id_entrenamiento);

        if (attendanceError) {
            console.error('Error fetching attendance:', attendanceError);
        } else {
            console.log(`Found ${attendance.length} attendance records.`);
            if (attendance.length > 0) {
                console.log('Sample:', attendance[0]);
            } else {
                console.log('Attendance list is empty.');
            }
        }
    }
}

debugTrainingModalLogic();
