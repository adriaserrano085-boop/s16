
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugEventAttendance() {
    console.log('--- Debugging Event -> Training -> Attendance Chain ---');

    // 1. Get a recent training event (UUID and id_eventos)
    const { data: events, error: eventError } = await supabase
        .from('eventos')
        .select('id, id_eventos, tipo, fecha')
        .eq('tipo', 'Entrenamiento') // or 'training' depending on DB
        .order('fecha', { ascending: false })
        .limit(1);

    if (eventError) {
        console.error('Error fetching event:', eventError);
        return;
    }

    if (!events || events.length === 0) {
        console.log('No training events found.');
        return;
    }

    const event = events[0];
    console.log('Selected Event:', event);

    // 2. Try to find training using UUID (id) - Likely to fail if foreign key is id_eventos
    console.log(`\nAttempting to find training with event UUID: ${event.id}`);
    const { data: trainingUuid, error: errorUuid } = await supabase
        .from('entrenamientos')
        .select('*')
        .eq('evento', event.id); // Assuming 'evento' is the FK column

    console.log('Result using UUID:', trainingUuid?.length ? 'Found' : 'Not Found');
    if (errorUuid) console.log('Error:', errorUuid.message);


    // 3. Try to find training using id_eventos (Int)
    console.log(`\nAttempting to find training with event id_eventos (Int): ${event.id_eventos}`);
    const { data: trainingInt, error: errorInt } = await supabase
        .from('entrenamientos')
        .select('*')
        .eq('evento', event.id_eventos);

    console.log('Result using Int ID:', trainingInt?.length ? 'Found' : 'Not Found');
    if (trainingInt?.length) {
        console.log('Training Record:', trainingInt[0]);

        // 4. If found, fetch attendance
        const trainingId = trainingInt[0].id_entrenamiento || trainingInt[0].id; // Check actual PK column name
        console.log(`\nFetching attendance for Training ID: ${trainingId}`);

        const { data: attendance, error: attError } = await supabase
            .from('asistencia')
            .select('*')
            .eq('entrenamiento', trainingId); // Check FK column name

        console.log('Attendance Records Found:', attendance?.length || 0);
        if (attError) console.error('Attendance Error:', attError);
    } else {
        if (errorInt) console.log('Error:', errorInt.message);
    }
}

debugEventAttendance();
