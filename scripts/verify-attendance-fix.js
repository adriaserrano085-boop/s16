
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFix() {
    console.log('1. Fetching attendance with entrenamientos...');
    const { data: attendanceData, error: attendanceError } = await supabase
        .from('asistencia')
        .select('*, entrenamientos(*)')
        .limit(5);

    if (attendanceError) {
        console.error('Attendance Fetch Error:', attendanceError);
        return;
    }

    if (!attendanceData || attendanceData.length === 0) {
        console.log('No attendance data found.');
        return;
    }

    console.log(`Found ${attendanceData.length} records.`);

    // Extract event IDs
    const eventIds = [...new Set(attendanceData
        .map(record => record.entrenamientos?.evento)
        .filter(id => id))];

    console.log('Event IDs:', eventIds);

    if (eventIds.length === 0) {
        console.log('No event IDs found linked to trainings.');
        return;
    }

    // Fetch events (Try id)
    console.log('2. Fetching events by id...');
    let { data: eventsData, error: eventsError } = await supabase
        .from('eventos')
        .select('id, tipo, fecha')
        .in('id', eventIds);

    if (eventsData && eventsData.length === 0) {
        console.log('No events found by id. Trying id_eventos...');
        const { data: eventsData2, error: eventsError2 } = await supabase
            .from('eventos')
            .select('id, id_eventos, tipo, fecha')
            .in('id_eventos', eventIds);

        if (eventsError2) console.error(eventsError2);
        else {
            eventsData = eventsData2;
            console.log(`Found ${eventsData.length} events by id_eventos.`);
        }
    }

    if (eventsError) {
        console.error('Events Fetch Error:', eventsError);
        return;
    }

    console.log(`Found ${eventsData.length} events.`);

    // Map back
    const eventsMap = {};
    eventsData.forEach(event => {
        eventsMap[event.id] = event;
    });

    const enriched = attendanceData.map(record => {
        const eventId = record.entrenamientos?.evento;
        const eventDetail = eventsMap[eventId];
        return {
            id: record.id,
            jugador: record.jugador,
            asistencia: record.asistencia,
            eventName: eventDetail?.Tipo,
            eventDate: eventDetail?.fecha || eventDetail?.date
        };
    });

    console.log('Enriched Data Sample:', JSON.stringify(enriched[0], null, 2));
}

verifyFix();
