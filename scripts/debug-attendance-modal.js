import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAttendanceModal() {
    console.log('\n=== DEBUGGING ATTENDANCE MODAL ===\n');

    // 1. Check entrenamientos table
    console.log('1. Checking entrenamientos table...');
    const { data: trainings, error: trainingsError } = await supabase
        .from('entrenamientos')
        .select('*')
        .limit(5);

    if (trainingsError) {
        console.error('❌ Error fetching entrenamientos:', trainingsError.message);
    } else {
        console.log(`✅ Found ${trainings.length} entrenamientos`);
        if (trainings.length > 0) {
            console.log('Sample:', trainings[0]);
            console.log('Columns:', Object.keys(trainings[0]));
        }
    }

    // 2. Check eventos table
    console.log('\n2. Checking eventos table...');
    const { data: events, error: eventsError } = await supabase
        .from('eventos')
        .select('*')
        .limit(5);

    if (eventsError) {
        console.error('❌ Error fetching eventos:', eventsError.message);
    } else {
        console.log(`✅ Found ${events.length} eventos`);
        if (events.length > 0) {
            console.log('Sample:', events[0]);
            console.log('Columns:', Object.keys(events[0]));
        }
    }

    // 3. Try the exact query from AttendanceModal
    console.log('\n3. Testing AttendanceModal query...');
    const { data: modalData, error: modalError } = await supabase
        .from('entrenamientos')
        .select(`
            id,
            evento,
            eventos (
                id,
                Titulo,
                fecha,
                hora
            )
        `)
        .order('eventos(fecha)', { ascending: false })
        .limit(20);

    if (modalError) {
        console.error('❌ Modal query error:', modalError.message);
        console.error('Details:', modalError);
    } else {
        console.log(`✅ Modal query returned ${modalData.length} results`);
        if (modalData.length > 0) {
            console.log('Sample result:', modalData[0]);
        }
    }

    // 4. Check jugadores_propios
    console.log('\n4. Checking jugadores_propios table...');
    const { data: players, error: playersError } = await supabase
        .from('jugadores_propios')
        .select('*')
        .limit(3);

    if (playersError) {
        console.error('❌ Error fetching jugadores_propios:', playersError.message);
    } else {
        console.log(`✅ Found ${players.length} jugadores_propios`);
        if (players.length > 0) {
            console.log('Sample:', players[0]);
        }
    }
}

debugAttendanceModal();
