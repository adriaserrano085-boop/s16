
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
    console.log("--- Fetching one analisis_partido ---");
    const { data, error } = await supabase.from('analisis_partido').select('*').limit(1);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("KEYS_START");
        Object.keys(data[0]).forEach(key => console.log(key));
        console.log("Sample Row:", data[0]);
        console.log("KEYS_END");
    } else {
        console.log("Table found but empty or permission denied for read. Attempting to insert dummy to check columns is risky without knowing constraints.");
        // Try to select specific columns to see if they error? No, '*' is best for discovery if row exists.
        // If no rows, we can't see keys from data. We rely on error message? No, empty data returns [] with no error.
    }
}

inspectTable();
