import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAsistenciaEnum() {
    // Try to get existing records to see what values are used
    const { data, error } = await supabase
        .from('asistencia')
        .select('asistencia')
        .limit(10);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Existing asistencia values:');
        const uniqueValues = [...new Set(data.map(d => d.asistencia).filter(Boolean))];
        console.log(uniqueValues);
    }
}

checkAsistenciaEnum();
