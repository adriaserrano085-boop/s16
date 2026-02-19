
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// Start with anon key 
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlayers() {
    console.log("Checking jugadores_propios...");

    // Select all players and their specific columns
    const { data: players, error } = await supabase
        .from('jugadores_propios')
        .select('id, nombre, apellidos, Usuario');

    if (error) {
        console.error("Error fetching players:", error);
        return;
    }

    console.log(`Found ${players.length} players.`);

    const playersWithUser = players.filter(p => p.Usuario);
    console.log(`Players with linked 'Usuario': ${playersWithUser.length}`);

    playersWithUser.forEach(p => {
        console.log(`- ${p.nombre} ${p.apellidos} -> Usuario ID: ${p.Usuario}`);
    });

    if (playersWithUser.length === 0) {
        console.log("\nWARNING: No players have a linked 'Usuario' (Auth ID).");
        console.log("This is likely why role detection falls back to STAFF.");
    }
}

checkPlayers();
