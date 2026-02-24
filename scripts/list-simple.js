
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');
const env = {};
envLines.forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listRecentMatches() {
    console.log("Fetching recent match events...");
    const { data, error } = await supabase
        .from('eventos')
        .select(`
            id, 
            fecha, 
            tipo,
            partidos (
                id,
                Rival
            )
        `)
        .eq('tipo', 'Partido')
        .order('fecha', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error:", error);
        return;
    }

    data.forEach(e => {
        const rival = e.partidos?.[0]?.Rival || 'Desconocido';
        console.log(`ID: ${e.id} | Date: ${e.fecha} | Rival: ${rival}`);
    });
}

listRecentMatches();
