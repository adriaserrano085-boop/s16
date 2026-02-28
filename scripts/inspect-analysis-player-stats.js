
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('analisis_partido').select('raw_json').limit(5);
    if (error) {
        console.error(error);
        return;
    }

    data.forEach((row, i) => {
        const root = row.raw_json || {};
        const informe = root.analisis_individual_plantilla || root.analisis_video_nac_sport?.analisis_individual_plantilla;

        if (informe && informe.jugadores) {
            console.log(`\nAnalysis ${i + 1} has player stats:`);
            informe.jugadores.slice(0, 3).forEach(j => {
                console.log(`Player: ${j.nombre || j.perfil?.nombre}`);
                console.log(`Stats:`, j.stats);
            });
        }
    });
}

check();
