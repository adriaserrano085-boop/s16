
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDataFlow() {
    console.log('--- Debugging Data Flow ---');

    // 1. Fetch Players from 'jugadores_propios'
    console.log("Fetching players from 'jugadores_propios'...");
    const { data: players, error: playersError } = await supabase.from('jugadores_propios').select('*').limit(1);

    if (playersError) {
        console.error('Error fetching players:', playersError);
        return;
    }

    if (!players || players.length === 0) {
        console.error('No players found in jugadores_propios.');
        return;
    }

    console.log('Sample Player:', players[0]);
    console.log(`Found ${players.length} players.`);
    const playerIds = new Set(players.map(p => p.id));

    // 2. Fetch Last 10 Trainings
    console.log("Fetching last 10 past trainings...");
    const { data: eventsData, error: eventsError } = await supabase.from('eventos').select('*');
    if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return;
    }

    const now = new Date();
    const pastTrainings = eventsData
        .filter(e => {
            const type = (e.tipo || e.Tipo || '').toLowerCase();
            const isTraining = type.includes('entrenamiento') || type.includes('training');
            const eventDate = e.fecha ? new Date(`${e.fecha}T${e.hora || '00:00'}`) : new Date(0);
            return isTraining && eventDate < now;
        })
        .sort((a, b) => {
            const dateA = a.fecha ? new Date(`${a.fecha}T${a.hora || '00:00'}`) : new Date(0);
            const dateB = b.fecha ? new Date(`${b.fecha}T${b.hora || '00:00'}`) : new Date(0);
            return dateB - dateA;
        })
        .slice(0, 10);

    console.log(`Found ${pastTrainings.length} past training events.`);
    if (pastTrainings.length === 0) return;

    const eventIds = pastTrainings.map(e => e.id);

    // 3. Fetch 'entrenamientos' linking table
    const { data: trainingData, error: trainingError } = await supabase
        .from('entrenamientos')
        .select('id_entrenamiento, evento')
        .in('evento', eventIds);

    if (trainingError) {
        console.error('Error fetching entrenamientos:', trainingError);
        return;
    }

    const trainingIds = trainingData.map(t => t.id_entrenamiento);
    console.log(`Found ${trainingIds.length} training records corresponding to these events.`);

    // 4. Fetch Attendance
    const { data: attendanceData, error: attendanceError } = await supabase
        .from('asistencia')
        .select('*')
        .in('entrenamiento', trainingIds);

    if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
        return;
    }

    console.log(`Found ${attendanceData.length} attendance records.`);

    // 5. Verify Linking
    let matchedCount = 0;
    let unmatchedCount = 0;

    attendanceData.forEach(record => {
        if (playerIds.has(record.jugador)) {
            matchedCount++;
        } else {
            unmatchedCount++;
            // console.log(`Unmatched player ID: ${record.jugador}`);
        }
    });

    console.log(`Linking Check:`);
    console.log(` - Matched Records (Player exists locally): ${matchedCount}`);
    console.log(` - Unmatched Records (Player ID not in fetched list): ${unmatchedCount}`);

    if (matchedCount === 0 && attendanceData.length > 0) {
        console.error("CRITICAL: Attendance records exist but NONE match the players in 'jugadores_propios'.");
        console.error("This usually means 'jugadores_propios' is empty or contains different UUIDs than 'asistencia' table.");

        console.log("Sample Player IDs from DB:", players.slice(0, 3).map(p => p.id));
        console.log("Sample Attendance Jugador IDs:", attendanceData.slice(0, 3).map(a => a.jugador));
    } else {
        console.log("Data linking appears correct.");
    }

}

debugDataFlow();
