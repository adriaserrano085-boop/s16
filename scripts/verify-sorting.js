
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySorting() {
    const { data: players, error } = await supabase
        .from('jugadores_propios')
        .select('*');

    if (error) {
        console.error(error);
        return;
    }

    const getPrimaryPositionNumber = (posiciones) => {
        if (!posiciones) return 999;
        const match = posiciones.match(/(\d+)/);
        return match ? parseInt(match[0], 10) : 999;
    };

    const sorted = [...players].sort((a, b) => {
        const posA = getPrimaryPositionNumber(a.posiciones);
        const posB = getPrimaryPositionNumber(b.posiciones);
        if (posA !== posB) {
            return posA - posB;
        }
        return a.nombre.localeCompare(b.nombre);
    });

    console.log("Sorted Players (First 20):");
    sorted.slice(0, 20).forEach(p => {
        console.log(`${getPrimaryPositionNumber(p.posiciones).toString().padStart(3)} | ${p.nombre} ${p.apellidos} (${p.posiciones?.replace(/[\r\n]+/g, '/')})`);
    });
}

verifySorting();
