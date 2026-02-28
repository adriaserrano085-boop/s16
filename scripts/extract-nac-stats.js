
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: allData } = await supabase.from('analisis_partido').select('raw_json');
    const target = allData.find(d => d.raw_json?.analisis_video_nac_sport?.rendimiento_individual_defensivo);

    if (target) {
        const def = target.raw_json.analisis_video_nac_sport.rendimiento_individual_defensivo;
        console.log("Defensive Stats - Top Tacklers:");
        console.log(JSON.stringify(def.top_tacklers_los_muros, null, 2));

        console.log("\nDefensive Stats - Alertas:");
        console.log(JSON.stringify(def.alertas_rendimiento_focos_de_rotura, null, 2));

        if (target.raw_json.match_report?.rosters_and_stats) {
            console.log("\nMatch Report Rosters & Stats (Local):");
            console.log(JSON.stringify(target.raw_json.match_report.rosters_and_stats.local.slice(0, 3), null, 2));
        }
    }
}

check();
