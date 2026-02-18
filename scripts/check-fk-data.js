
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    // Only way to check nullability via API without SQL access to information_schema is tricky.
    // We can try to inserting a row with null evento_id and see if it fails (if we have a valid partido_externo_id).
    // Or we can just inspect the error if we try to fetch.

    // Actually, I can use the SQL tool to check information_schema if I could ran SQL... 
    // I can't run ad-hoc SQL without a file. 

    // Let's trying to fetch 1 row from 'partidos' and see if 'Evento' is populated.
    const { data: partidos, error: pError } = await supabase.from('partidos').select('id, Evento').limit(5);
    console.log("Partidos 'Evento' check:", partidos);

    // Check if any analysis row has null evento_id
    const { data: analysis, error: aError } = await supabase.from('analisis_partido').select('id, evento_id').is('evento_id', null).limit(5);
    console.log("Analysis with null evento_id:", analysis);
}

checkSchema();
