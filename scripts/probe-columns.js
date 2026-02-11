
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectColumns() {
    console.log("Querying information_schema.columns for 'entrenamientos'...");

    // We might not have direct access to information_schema via the JS client depending on permissions.
    // But usually 'rpc' or just a raw query might work if allowed.
    // Actually, supabase JS client exposes rpc.
    // If we can't do that, we can try to infer from error messages.
    // But let's try a direct query if possible? No, Supabase JS client doesn't do raw SQL easily without RPC.

    // Alternative: Try to select specific columns one by one and catch errors?
    // "id", "id_entrenamiento", "entrenamiento_id", "evento", "evento_id"

    const candidates = ['id', 'id_entrenamiento', 'entrenamiento_id', 'ID', 'Id', 'ID_Entrenamiento'];

    for (const col of candidates) {
        const { error } = await supabase.from('entrenamientos').select(col).limit(1);
        if (!error) {
            console.log(`Column '${col}' EXISTS.`);
        } else {
            console.log(`Column '${col}' error: ${error.message} (Code: ${error.code})`);
        }
    }
}

inspectColumns();
