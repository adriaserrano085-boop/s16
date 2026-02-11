
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSpecificTables() {
    const tables = ['jugadores_propios', 'asistencia'];

    for (const table of tables) {
        console.log(`\n--- Inspecting '${table}' ---`);
        const { data, error } = await supabase.from(table).select('*').limit(1);

        if (error) {
            console.error(`Error fetching '${table}':`, error.message);
        } else if (data && data.length > 0) {
            console.log(`Keys for '${table}':`, Object.keys(data[0]));
            if (table === 'jugadores_propios') console.log(`Sample '${table}':`, data[0]);
        } else {
            console.log(`'${table}' is empty.`);

            // Probe with insert to get column info via error
            console.log(`Probing '${table}' with insert...`);
            const { data: insertData, error: insertError } = await supabase.from(table).insert({}).select();

            if (insertData) {
                console.log(`Insert successful (Keys):`, Object.keys(insertData[0]));
                // Cleanup
                if (insertData[0].id) await supabase.from(table).delete().eq('id', insertData[0].id);
            } else if (insertError) {
                console.log(`Insert Probe Error Message:`, insertError.message);
                console.log(`Insert Probe Error Details:`, insertError.details || "No details");
                console.log(`Insert Probe Error Hint:`, insertError.hint || "No hint");
            }
        }
    }
}

inspectSpecificTables();
