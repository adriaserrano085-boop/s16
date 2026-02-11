
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    console.log("--- Entrenamientos (First 5) ---");
    const { data: est, error: eErr } = await supabase.from('entrenamientos').select('id_entrenamiento, evento').limit(5);
    if (eErr) console.error(eErr);
    else console.log(JSON.stringify(est, null, 2));

    if (est.length > 0 && est[0].evento) {
        console.log(`\nChecking Evento ${est[0].evento} in Eventos table...`);
        const { data: ev, error: evErr } = await supabase.from('eventos').select('*').eq('id', est[0].evento);
        if (evErr) console.error(evErr);
        else console.log("Found in Eventos:", ev);
    } else {
        console.log("\nFirst training has no event ID or table empty.");
    }
}

inspectData();
