
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log("Checking columns individually...");

    const columns = ['calentamiento', 'trabajo_conjunto'];

    for (const col of columns) {
        const { error } = await supabase.from('entrenamientos').select(col).limit(1);
        if (error && error.message.includes('does not exist')) {
            console.log(`[MISSING] ${col}`);
        } else if (error) {
            console.log(`[ERROR] ${col}: ${error.message}`);
        } else {
            console.log(`[EXISTS] ${col}`);
        }
    }
}

checkColumns();
