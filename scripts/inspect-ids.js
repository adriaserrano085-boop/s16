
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectIds() {
    console.log("--- Fetching events IDs ---");
    const { data, error } = await supabase.from('eventos').select('id, id_eventos, tipo').limit(5);

    if (data) {
        console.table(data);
        data.forEach(row => {
            console.log(`MATCH: ${row.id === row.id_eventos}`);
            console.log(`id:          ${row.id}`);
            console.log(`id_eventos:  ${row.id_eventos}`);
            console.log('---');
        });
    }
}

inspectIds();
