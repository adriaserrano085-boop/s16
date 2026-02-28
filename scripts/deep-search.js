
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

const HOSPITALET_NAMES = ["RC L'HOSPITALET", "RC HOSPITALET", "HOSPITALET", "L'HOSPITALET", "RC L'HOSPI", "HOSPI"];
const isHospi = (name) => {
    if (!name) return false;
    const n = name.toUpperCase();
    return HOSPITALET_NAMES.some(hn => n.includes(hn));
};

async function deepSearch() {
    const { data: pStats } = await supabase.from('estadisticas_jugador').select('*');
    const { data: matches } = await supabase.from('partidos').select('*');
    const { data: extMatches } = await supabase.from('partidos_externos').select('*');

    const hospiStats = pStats.filter(ps => isHospi(ps.equipo));
    const allMatchIdsWithHospiStats = new Set([
        ...hospiStats.map(ps => ps.partido).filter(id => id),
        ...hospiStats.map(ps => ps.partido_externo).filter(id => id)
    ]);

    console.log(`Found ${hospiStats.length} player stat rows for Hospi across ${allMatchIdsWithHospiStats.size} distinct matches.`);

    console.log("\nMatches with Hospi Player Stats:");
    for (const mId of allMatchIdsWithHospiStats) {
        let source = "Unknown";
        let local = "??";
        let visitor = "??";

        let m = matches.find(match => match.id === mId);
        if (m) {
            source = "partidos";
            local = "RC L'HOSPITALET (Assumed Home)";
            visitor = m.Rival || "??";
        } else {
            m = extMatches.find(match => match.id === mId);
            if (m) {
                source = "partidos_externos";
                local = m.equipo_local;
                visitor = m.equipo_visitante;
            }
        }

        const count = hospiStats.filter(ps => ps.partido === mId || ps.partido_externo === mId).length;
        console.log(`- ID: ${mId} | Source: ${source} | ${local} vs ${visitor} | Stats: ${count}`);
    }
}

deepSearch();
