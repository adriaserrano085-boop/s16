
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probeColumns() {
    const table = 'jugadores_propios';
    const potentialColumns = ['id', 'nombre', 'apellidos', 'dorsal', 'posicion', 'foto', 'activo', 'email', 'telefono', 'user_id', 'usuario_id'];

    console.log(`Probing '${table}' columns...`);

    for (const col of potentialColumns) {
        const { error } = await supabase.from(table).select(col).limit(1);
        if (!error) {
            console.log(`Column found: ${col}`);
        } else {
            // console.log(`Column check failed for ${col}: ${error.message}`);
            if (!error.message.includes('exact matches')) { // Postgres error for "column does not exist" usually mentions it
                console.log(`Column ${col} ERROR: ${error.message}`);
            }
        }
    }
}

probeColumns();
