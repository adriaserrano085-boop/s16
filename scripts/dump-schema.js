
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpSchema() {
    const candidates = [
        'eventos', 'partidos', 'entrenamientos', 'asistencia', 'jugadores_propios',
        'users', 'profiles', 'teams', 'clubs', 'staff', 'entrenadores', 'usuarios', 'perfiles', 'socios', 'fichas',
        'rivales', 'temporadas', 'categorias' // Guessing some more
    ];

    let output = "--- Schema Dump ---\n";

    for (const table of candidates) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
            output += `\nTable: ${table}\n`;
            if (data && data.length > 0) {
                output += `Keys: ${JSON.stringify(Object.keys(data[0]))}\n`;
            } else {
                output += `(Empty Table)\n`;
                // Probe
                const { data: insertData, error: insertError } = await supabase.from(table).insert({}).select();
                if (insertData) {
                    output += `Keys (from insert probe): ${JSON.stringify(Object.keys(insertData[0]))}\n`;
                    if (insertData[0].id) await supabase.from(table).delete().eq('id', insertData[0].id);
                } else if (insertError) {
                    output += `Probe Error: ${insertError.message}\n`;
                }
            }
        }
    }

    fs.writeFileSync('schema-dump.txt', output);
    console.log("Schema dump written to schema-dump.txt");
}

dumpSchema();
