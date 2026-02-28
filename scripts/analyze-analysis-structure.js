
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: allData } = await supabase.from('analisis_partido').select('raw_json');
    const target = allData.find(d => d.raw_json?.analisis_individual_plantilla);

    if (target) {
        console.log("Analysis Keys:", Object.keys(target.raw_json));
        const players = target.raw_json.analisis_individual_plantilla.jugadores;
        if (players && players.length > 0) {
            console.log("\nSample Player Object Keys:", Object.keys(players[0]));
            console.log("\nSample Player Object:", JSON.stringify(players[0], null, 2));
        }

        const nac = target.raw_json.analisis_video_nac_sport || {};
        console.log("\nNAC Sport Keys:", Object.keys(nac));
        if (nac.rendimiento_individual_defensivo) {
            console.log("\nSample Defensive Stats Keys:", Object.keys(nac.rendimiento_individual_defensivo));
            // It's probably an object or array
            if (Array.isArray(nac.rendimiento_individual_defensivo)) {
                console.log("Sample Defensive Stats Entry:", JSON.stringify(nac.rendimiento_individual_defensivo[0], null, 2));
            } else {
                console.log("Defensive Stats is not an array, sample keys:", Object.keys(nac.rendimiento_individual_defensivo).slice(0, 5));
            }
        }
    }
}

check();
