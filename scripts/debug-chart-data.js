import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read .env
const envContent = readFileSync(resolve('.env'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) envVars[key.trim()] = val.join('=').trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function debug() {
    // 1. Get all events
    const { data: events, error: evErr } = await supabase.from('eventos').select('id, tipo, fecha, hora').order('fecha', { ascending: false }).limit(20);
    if (evErr) { console.error('Events error:', evErr); return; }
    console.log('=== RECENT EVENTS ===');
    events.forEach(e => console.log(`  ${e.id} | ${e.tipo} | ${e.fecha} | ${e.hora}`));

    // 2. Get attendance with trainings
    const { data: attendance, error: attErr } = await supabase.from('asistencia').select('*, entrenamientos(id_entrenamiento, evento)');
    if (attErr) { console.error('Attendance error:', attErr); return; }
    console.log(`\n=== ATTENDANCE RECORDS: ${attendance?.length || 0} ===`);

    if (attendance?.length > 0) {
        // Show unique event IDs from attendance
        const eventIdsFromAtt = [...new Set(attendance.map(a => a.entrenamientos?.evento))].filter(Boolean);
        console.log('Unique event IDs from attendance:', eventIdsFromAtt);

        // Check which of these event IDs match actual events
        const allEventIds = events.map(e => e.id);
        const matchingEventIds = eventIdsFromAtt.filter(id => allEventIds.includes(id));
        console.log('\nMatching event IDs in recent 20:', matchingEventIds.length, '/', eventIdsFromAtt.length);

        // Now check: in Dashboard, events are mapped with start = fecha + hora
        // The chart logic filters on new Date(e.start) < now
        const now = new Date();
        const pastEventsWithAtt = events
            .filter(e => eventIdsFromAtt.includes(e.id) && new Date(`${e.fecha}T${e.hora || '00:00:00'}`) < now)
            .sort((a, b) => new Date(`${b.fecha}T${b.hora || '00:00:00'}`) - new Date(`${a.fecha}T${a.hora || '00:00:00'}`))
            .slice(0, 10);
        console.log('\nPast events with attendance (last 10):');
        pastEventsWithAtt.forEach(e => console.log(`  ${e.id} | ${e.tipo} | ${e.fecha} | ${e.hora}`));

        // Show sample attendance records
        console.log('\nSample attendance records (first 5):');
        attendance.slice(0, 5).forEach(a => {
            console.log(`  jugador: ${a.jugador} | asistencia: ${a.asistencia} | entrenamiento: ${a.entrenamiento} | evento: ${a.entrenamientos?.evento}`);
        });

        // Show unique asistencia values
        const uniqueValues = [...new Set(attendance.map(a => a.asistencia))];
        console.log('\nUnique asistencia values:', uniqueValues);
    }
}

debug().catch(console.error);
