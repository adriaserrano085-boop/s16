
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAnalyses() {
    const { data: analyses } = await supabase.from('analisis_partido').select('*');
    const { data: rivals } = await supabase.from('rivales').select('*');
    const rivalsMap = {};
    rivals.forEach(r => rivalsMap[r.id_equipo || r.id] = r.nombre_equipo);

    console.log(`Found ${analyses.length} analyses.\n`);

    analyses.forEach((a, i) => {
        const root = a.raw_json || {};
        const nac = root.analisis_video_nac_sport || {};
        const technical = root.analisis_individual_plantilla || nac.analisis_individual_plantilla;

        let matchName = "Unknown";
        if (root.match_report?.match_id) matchName = root.match_report.match_id;
        else if (root.nombre_partido) matchName = root.nombre_partido;

        console.log(`Analysis ${i + 1}: ID=${a.id}`);
        console.log(`- Match: ${matchName}`);
        console.log(`- Related IDs: partido=${a.partido_id}, ext=${a.partido_externo_id}, evento=${a.evento_id}`);

        // Check for local/visitor info
        if (root.match_report?.summary) {
            console.log(`- Summary Score: ${root.match_report.summary.home_score} - ${root.match_report.summary.away_score}`);
            console.log(`- Home: ${root.match_report.summary.home_team}, Away: ${root.match_report.summary.away_team}`);
        }

        if (nac.resumen_partido) {
            console.log(`- NAC Goal: ${nac.resumen_partido.goles_local} - ${nac.resumen_partido.goles_visitante}`);
        }

        console.log(`-----------------------------------`);
    });
}

checkAnalyses();
