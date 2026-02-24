
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable(tableName) {
    console.log(`\n--- Inspecting ${tableName} ---`);
    const { data, error } = await supabase.from(tableName).select('*').limit(1);

    if (error) {
        console.error(`Error fetching from ${tableName}:`, error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log(`Columns for ${tableName}:`, Object.keys(data[0]));
    } else {
        console.log(`Table ${tableName} is empty or no data returned.`);
    }
}

inspectTable('analisis_partido');
