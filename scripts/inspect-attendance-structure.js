import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAsistenciaAndJugadores() {
    console.log('\n=== ASISTENCIA TABLE ===');
    const { data: asistenciaData, error: asistenciaError } = await supabase
        .from('asistencia')
        .select('*')
        .limit(1);

    if (asistenciaError) {
        console.error('Error:', asistenciaError.message);
    } else if (asistenciaData && asistenciaData.length > 0) {
        console.log('Columns:', Object.keys(asistenciaData[0]));
        console.log('Sample:', asistenciaData[0]);
    } else {
        console.log('Table is empty');
    }

    console.log('\n=== JUGADORES_PROPIOS TABLE ===');
    const { data: jugadoresData, error: jugadoresError } = await supabase
        .from('jugadores_propios')
        .select('*')
        .limit(3);

    if (jugadoresError) {
        console.error('Error:', jugadoresError.message);
    } else if (jugadoresData) {
        console.log('Count:', jugadoresData.length);
        console.log('Columns:', jugadoresData.length > 0 ? Object.keys(jugadoresData[0]) : 'N/A');
        console.log('Sample:', jugadoresData[0]);
    }

    console.log('\n=== ENTRENAMIENTOS TABLE ===');
    const { data: entrenamientosData, error: entrenamientosError } = await supabase
        .from('entrenamientos')
        .select('*')
        .limit(1);

    if (entrenamientosError) {
        console.error('Error:', entrenamientosError.message);
    } else if (entrenamientosData && entrenamientosData.length > 0) {
        console.log('Columns:', Object.keys(entrenamientosData[0]));
        console.log('Sample:', entrenamientosData[0]);
    } else {
        console.log('Table is empty');
    }
}

inspectAsistenciaAndJugadores();
