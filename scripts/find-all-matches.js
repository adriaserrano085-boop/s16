
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

async function findAllHospiMatches() {
    const { data: matches } = await supabase.from('partidos').select('*');
    const { data: extMatches } = await supabase.from('partidos_externos').select('*');
    const { data: rivals } = await supabase.from('rivales').select('*');
    const { data: pStats } = await supabase.from('estadisticas_jugador').select('partido, partido_externo, equipo');

    const rivalsMap = {};
    rivals.forEach(r => rivalsMap[r.id_equipo || r.id] = r.nombre_equipo);

    console.log("--- SEARCHING IN 'partidos' ---");
    matches.forEach(m => {
        const rival = rivalsMap[m.Rival] || m.Rival;
        // In this schema, 'partidos' usually implies Hospi is one side.
        // Let's assume Hospi is always involved in 'partidos'.
        // But let's check if 'Rival' could be Hospi? (Unlikely but possible)
        const hospiIsLocal = true; // Based on previous observation
        const hospiIsVisitor = isHospi(rival);

        if (hospiIsLocal || hospiIsVisitor) {
            const hasStats = pStats.some(ps => ps.partido === m.id && isHospi(ps.equipo));
            console.log(`[PARTIDO] Local: RC L'HOSPITALET vs Visitor: ${rival} | Has Stats: ${hasStats}`);
        }
    });

    console.log("\n--- SEARCHING IN 'partidos_externos' ---");
    extMatches.forEach(m => {
        const hospiIsLocal = isHospi(m.equipo_local);
        const hospiIsVisitor = isHospi(m.equipo_visitante);

        if (hospiIsLocal || hospiIsVisitor) {
            const hasStats = pStats.some(ps => ps.partido_externo === m.id && isHospi(ps.equipo));
            console.log(`[EXTERNAL] Local: ${m.equipo_local} vs Visitor: ${m.equipo_visitante} | Has Stats: ${hasStats}`);
        }
    });

    // Let's also check for IDs in pStats that don't match any found above
    const foundIds = new Set([
        ...matches.map(m => m.id),
        ...extMatches.map(m => m.id)
    ]);

    const unknownIds = [...new Set(pStats.filter(ps => isHospi(ps.equipo) && !foundIds.has(ps.partido || ps.partido_externo)).map(ps => ps.partido || ps.partido_externo))];
    if (unknownIds.length > 0) {
        console.log("\n--- UNKNOWN MATCH IDs IN pStats ---");
        unknownIds.forEach(id => console.log(`- ${id}`));
    }
}

findAllHospiMatches();
