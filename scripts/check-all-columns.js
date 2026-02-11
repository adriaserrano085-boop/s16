import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllColumns() {
    console.log('=== CHECKING ALL TABLE COLUMNS ===\n');

    // Check entrenamientos
    console.log('1. ENTRENAMIENTOS:');
    const { data: ent } = await supabase.from('entrenamientos').select('*').limit(1);
    if (ent && ent.length > 0) {
        console.log('Columns:', Object.keys(ent[0]));
        console.log('Sample:', ent[0]);
    }

    // Check eventos
    console.log('\n2. EVENTOS:');
    const { data: evt } = await supabase.from('eventos').select('*').limit(1);
    if (evt && evt.length > 0) {
        console.log('Columns:', Object.keys(evt[0]));
    }

    // Check asistencia
    console.log('\n3. ASISTENCIA:');
    const { data: asis } = await supabase.from('asistencia').select('*').limit(1);
    if (asis && asis.length > 0) {
        console.log('Columns:', Object.keys(asis[0]));
    }

    // Check jugadores_propios
    console.log('\n4. JUGADORES_PROPIOS:');
    const { data: jug } = await supabase.from('jugadores_propios').select('*').limit(1);
    if (jug && jug.length > 0) {
        console.log('Columns:', Object.keys(jug[0]));
    }
}

checkAllColumns();
