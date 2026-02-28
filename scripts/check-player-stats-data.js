
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('estadisticas_jugador').select('*').limit(5);
    if (error) {
        console.error(error);
        return;
    }
    if (data && data.length > 0) {
        console.log('Sample data for estadisticas_jugador:');
        data.forEach((row, i) => {
            console.log(`\nRow ${i + 1}:`);
            console.log(JSON.stringify(row, null, 2));
        });
    } else {
        console.log('Table is empty.');
    }
}

check();
