
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probeEnum() {
    console.log("Probing 'asistencia' table for enum values...");

    // Attempt to insert an invalid value to trigger a Postgres error that might list allowed values
    const { data, error } = await supabase
        .from('asistencia')
        .insert({
            entrenamiento: '045db875-c54d-4589-9b93-b8e7343e7766', // Use a real training ID from our previous dump if possible
            jugador: '707caf25-d26b-4f96-bd7c-642818a55633',      // Use a real player ID
            asistencia: 'INVALID_VALUE'
        });

    if (error) {
        console.log("Error Code:", error.code);
        console.log("Error Message:", error.message);
        console.log("Error Details:", error.details);
        console.log("Error Hint:", error.hint);
    } else {
        console.log("Insert succeeded unexpectedy!");
    }
}

probeEnum();
