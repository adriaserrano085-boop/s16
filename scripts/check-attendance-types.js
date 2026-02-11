
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAttendanceTypes() {
    console.log('--- Checking Attendance Types ---');

    const { data, error } = await supabase
        .from('asistencia')
        .select('asistencia');

    if (error) {
        console.error('Error fetching attendance:', error);
        return;
    }

    const uniqueTypes = [...new Set(data.map(item => item.asistencia))];
    console.log('Distinct Attendance Types:', uniqueTypes);
}

checkAttendanceTypes();
