
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActas() {
    const { data: matches } = await supabase.from('partidos').select('*');
    const { data: pStats } = await supabase.from('estadisticas_jugador').select('partido');

    console.log("--- ACTA STATUS FOR ALL 10 MATCHES ---");
    matches.forEach(m => {
        const hasStats = pStats.some(ps => ps.partido === m.id);
        console.log(`\nMatch ID: ${m.id}`);
        console.log(`- Rival Column: ${m.Rival}`);
        console.log(`- Score: ${m.marcador_local} - ${m.marcador_visitante}`);
        console.log(`- Acta URL: ${m.acta_url || 'NONE'}`);
        console.log(`- Has Player Stats: ${hasStats}`);
    });
}

checkActas();
