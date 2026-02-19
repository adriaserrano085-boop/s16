
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0OTQ1MDYsImV4cCI6MjA1NDA3MDUwNn0.u6fFq2h7k0j-L6CqVpC5yO-1n4wz9gTdbGj-D8GkX8o';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConvocatorias() {
    console.log('--- Probing convocatorias schema ---');

    const { data, error } = await supabase
        .from('convocatorias')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching convocatorias:', error);
    } else {
        console.log('Convocatorias sample:', data);
    }
}

checkConvocatorias();
