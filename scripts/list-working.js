
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

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

    if (!data || data.length === 0) {
        console.log("No matches found.");
        return;
    }

    data.forEach(e => {
        const rival = e.partidos?.[0]?.Rival || 'Desconocido';
        console.log(`ID: ${e.id} | Date: ${e.fecha} | Rival: ${rival}`);
    });
}

listRecentMatches();
