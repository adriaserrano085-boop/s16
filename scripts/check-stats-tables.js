
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

// Fallback if .env.local missing/empty (using values from previous artifacts)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTables() {
    console.log('Checking tables...');

    // Check estadisticas_partido
    const { count: matchCount, error: matchError } = await supabase
        .from('estadisticas_partido')
        .select('*', { count: 'exact', head: true });

    if (matchError) {
        console.error('Error checking estadisticas_partido:', matchError);
    } else {
        console.log(`estadisticas_partido exists. Row count: ${matchCount}`);
    }

    // Check estadisticas_jugador
    const { count: playerCount, error: playerError } = await supabase
        .from('estadisticas_jugador')
        .select('*', { count: 'exact', head: true });

    if (playerError) {
        console.error('Error checking estadisticas_jugador:', playerError);
    } else {
        console.log(`estadisticas_jugador exists. Row count: ${playerCount}`);
    }
}

checkTables();
