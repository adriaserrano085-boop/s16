
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAnalyses() {
    console.log("Checking 'analisis_partido' table...");

    const { data: analyses, error } = await supabase
        .from('analisis_partido')
        .select('id, evento_id, partido_externo_id, created_at');

    if (error) {
        console.error("Error fetching analyses:", error);
        return;
    }

    console.log(`Found ${analyses.length} analysis records.`);

    // Check validity of links
    for (const a of analyses) {
        let status = 'UNKNOWN';
        let detail = '';

        if (a.partido_externo_id) {
            const { data: extMatch } = await supabase
                .from('partidos_externos')
                .select('id, fecha, equipo_local, equipo_visitante')
                .eq('id', a.partido_externo_id)
                .maybeSingle();
            
            if (extMatch) {
                status = 'VALID (External)';
                detail = `${extMatch.fecha}: ${extMatch.equipo_local} vs ${extMatch.equipo_visitante}`;
            } else {
                status = 'ORPHANED (External)';
                detail = `Link to ID ${a.partido_externo_id} which does not exist.`;
            }
        } else if (a.evento_id) {
             const { data: evtMatch } = await supabase
                .from('eventos')
                .select('id, fecha')
                .eq('id', a.evento_id)
                .maybeSingle();

            if (evtMatch) {
                status = 'VALID (Event)';
                detail = `${evtMatch.fecha}`;
            } else {
                status = 'ORPHANED (Event)';
                detail = `Link to ID ${a.evento_id} which does not exist.`;
            }
        } else {
            status = 'INVALID (No Link)';
        }

        console.log(`[${a.id}] ${status} - ${detail}`);
    }
}

checkAnalyses();
