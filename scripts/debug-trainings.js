
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log("Fetching first 5 rows from entrenamientos...");
    const { data, error } = await supabase.from('entrenamientos').select('*').limit(5);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Rows found:", data.length);
        if (data.length > 0) {
            console.log("Columns:", Object.keys(data[0]));
            console.log("Sample Data:", JSON.stringify(data, null, 2));
        } else {
            console.log("Table is empty.");
        }
    }
}

inspect();
