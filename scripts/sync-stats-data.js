import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function syncStatsData() {
    console.log('--- Starting Statistics Synchronization ---');

    // 1. Fetch all data
    const { data: statsRecords, error: sError } = await supabase.from('estadisticas_partido').select('*');
    const { data: partidos, error: pError } = await supabase.from('partidos').select('*');
    const { data: externos, error: eError } = await supabase.from('partidos_externos').select('*');

    if (sError || pError || eError) {
        console.error('Error fetching data:', { sError, pError, eError });
        return;
    }

    const matchesMap = Object.fromEntries(partidos.map(p => [p.id, p]));
    const externosMap = Object.fromEntries(externos.map(e => [e.id, e]));

    console.log(`Processing ${statsRecords.length} statistics records...`);

    let updatedCount = 0;
    for (const record of statsRecords) {
        let needsUpdate = false;
        const updates = {};

        // Find reference match
        const refMatch = record.partido ? matchesMap[record.partido] : (record.partido_externo ? externosMap[record.partido_externo] : null);

        if (!refMatch) continue;

        // Compare and update scores
        if ((record.marcador_local === null || record.marcador_local === 0) && (refMatch.marcador_local !== null && refMatch.marcador_local !== 0)) {
            updates.marcador_local = refMatch.marcador_local;
            needsUpdate = true;
        }
        if ((record.marcador_visitante === null || record.marcador_visitante === 0) && (refMatch.marcador_visitante !== null && refMatch.marcador_visitante !== 0)) {
            updates.marcador_visitante = refMatch.marcador_visitante;
            needsUpdate = true;
        }

        // Compare and update tries
        if ((record.ensayos_local === null || record.ensayos_local === 0) && (refMatch.ensayos_local !== null && refMatch.ensayos_local !== 0)) {
            updates.ensayos_local = refMatch.ensayos_local;
            needsUpdate = true;
        }
        if ((record.ensayos_visitante === null || record.ensayos_visitante === 0) && (refMatch.ensayos_visitante !== null && refMatch.ensayos_visitante !== 0)) {
            updates.ensayos_visitante = refMatch.ensayos_visitante;
            needsUpdate = true;
        }

        // Update date if missing
        if (!record.fecha && refMatch.fecha) {
            updates.fecha = refMatch.fecha;
            needsUpdate = true;
        }
        // Special case for 'partidos' which might have 'fecha' in another field or we use Evento
        // But for now let's focus on markers.

        if (needsUpdate) {
            console.log(`Updating record ${record.id} for match: ${refMatch.equipo_local || 'HOSPI'} vs ${refMatch.equipo_visitante || refMatch.Rival}`);
            const { error: uError } = await supabase.from('estadisticas_partido').update(updates).eq('id', record.id);
            if (uError) console.error(`Error updating record ${record.id}:`, uError);
            else updatedCount++;
        }
    }

    console.log(`\nSynchronization complete. Updated ${updatedCount} records.`);
}

syncStatsData();
