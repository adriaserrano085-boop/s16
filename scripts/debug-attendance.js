
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    const SUPABASE_URL = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    console.log("--- Fetching Training ID ---");
    const entRes = await fetch(`${SUPABASE_URL}/rest/v1/entrenamientos?select=id&limit=1`, { headers });
    const entData = await entRes.json();
    console.log("Entrenamientos:", entData);

    console.log("--- Fetching Player ID ---");
    const jugRes = await fetch(`${SUPABASE_URL}/rest/v1/jugadores_propios?select=id&limit=1`, { headers });
    const jugData = await jugRes.json();
    console.log("Jugadores:", jugData);

    const dummyTrainingId = entData[0]?.id || '00000000-0000-0000-0000-000000000000';
    const dummyPlayerId = jugData[0]?.id || '00000000-0000-0000-0000-000000000000';

    console.log(`\n--- Probing Enum for 'asistencia' column with training=${dummyTrainingId}, jugador=${dummyPlayerId} ---`);
    const probeRes = await fetch(`${SUPABASE_URL}/rest/v1/asistencia`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            entrenamiento: dummyTrainingId,
            jugador: dummyPlayerId,
            asistencia: 'INVALID_VALUE'
        })
    });

    const probeError = await probeRes.json();
    console.log("Probe Result Status:", probeRes.status);
    console.log("Probe Result Body:", JSON.stringify(probeError, null, 2));

    if (probeError.message && probeError.message.includes('invalid input value for enum')) {
        console.log("\nSUCCESS! Found enum error.");
    }
}

run();
