
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmptyMatches() {
    const emptyIds = [
        'df90e18e-33b2-4180-868a-24421f39ce28',
        'da78b9bf-ed9d-4e3c-97e7-6a7f85d38e26',
        'f75e4c1d-c707-4e56-b152-bc2aebf3be67',
        '7a1ab1e2-f2d8-4f82-a0cf-8dbc979498a3',
        'bedbcef8-d587-46dc-bcea-a2b76e6cbaae'
    ];

    for (const id of emptyIds) {
        const { data: stats } = await supabase.from('estadisticas_jugador').select('equipo, nombre').eq('partido', id);
        console.log(`Match ID ${id}: Found ${stats?.length || 0} player rows.`);
        if (stats && stats.length > 0) {
            const teams = [...new Set(stats.map(s => s.equipo))];
            console.log(`- Teams: ${teams.join(", ")}`);
        }
    }
}

checkEmptyMatches();
