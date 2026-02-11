
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log("--- Listing Tables ---");
    const candidates = [
        'users', 'profiles', 'players', 'team_members', 'miembros', 'equipos_jugadores', 'jugador',
        'teams', 'clubs', 'coaches', 'staff', 'entrenadores', 'usuarios', 'perfiles', 'socios', 'fichas'
    ];

    for (const table of candidates) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
            console.log(`Found table: ${table}`);
            if (data && data.length > 0) {
                console.log(`Keys for ${table}:`, Object.keys(data[0]));
                console.log(`Sample ${table}:`, data[0]);
            } else {
                console.log(`Table ${table} is empty.`);
            }
        }
    }

    console.log("\n--- Probing 'asistencia' Columns ---");
    // Try to insert empty object to get defaults or error with column info
    try {
        const { data: attData, error: attError } = await supabase.from('asistencia').insert({}).select();

        if (attData && attData.length > 0) {
            console.log("Keys from Insert:", Object.keys(attData[0]));
            // Cleanup
            if (attData[0].id) await supabase.from('asistencia').delete().eq('id', attData[0].id);
        } else if (attError) {
            console.log("Insert failed:", attError.message);
            console.log("Error details:", attError.details || attError.hint);
        }
    } catch (e) {
        console.log("Exception during probe:", e);
    }
}

listTables();
