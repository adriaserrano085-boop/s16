
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('analisis_partido').select('raw_json').eq('id', '91aae3b4-8dbb-433c-829d-01f705a63901'); // Assuming this is Analysis 22 or similar
    // Actually let me just get the one that has analisis_individual_plantilla
    const { data: allData } = await supabase.from('analisis_partido').select('raw_json');
    const target = allData.find(d => d.raw_json?.analisis_individual_plantilla);

    if (target) {
        const informe = target.raw_json.analisis_individual_plantilla;
        console.log("Player stats from analisis_individual_plantilla:");
        informe.jugadores.forEach(j => {
            console.log(`\nPlayer: ${j.nombre || j.perfil?.nombre}`);
            console.log(`Stats:`, JSON.stringify(j.stats, null, 2));
        });
    } else {
        console.log("No analysis with player stats found.");
    }
}

check();
