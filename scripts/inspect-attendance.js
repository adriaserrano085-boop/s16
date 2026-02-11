
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log("--- Inspecting 'asistencia' ---");
    const { data: attData, error: attError } = await supabase.from('asistencia').select('*').limit(1);
    if (attError) console.error("Error 'asistencia':", attError.message);
    else if (attData.length > 0) {
        console.log("Keys:", Object.keys(attData[0]));
        console.log("Sample:", attData[0]);
    } else console.log("'asistencia' table is empty.");

    console.log("\n--- Inspecting 'jugadores' (guessing name) ---");
    const { data: jugData, error: jugError } = await supabase.from('jugadores').select('*').limit(1);
    if (jugError) {
        console.error("Error 'jugadores':", jugError.message);
        // Try 'users' or 'profiles' or 'miembros' if 'jugadores' fails
        console.log("Trying 'perfil_jugador'...");
        const { data: profileData, error: profileError } = await supabase.from('perfil_jugador').select('*').limit(1);
        if (profileData && profileData.length > 0) {
            console.log("Keys 'perfil_jugador':", Object.keys(profileData[0]));
        } else if (profileError) console.error("Error 'perfil_jugador':", profileError.message);
    }
    else if (jugData.length > 0) {
        console.log("Keys 'jugadores':", Object.keys(jugData[0]));
        console.log("Sample:", jugData[0]);
    } else console.log("'jugadores' table is empty.");
}

inspectSchema();
