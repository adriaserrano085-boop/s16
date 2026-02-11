
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectLinkage() {
    console.log("--- Events ---");
    const { data: events, error: eErr } = await supabase.from('eventos').select('id, id_eventos').limit(3);
    if (eErr) console.error("Event Error:", eErr);
    else console.log("Events:", events);

    console.log("--- Trainings ---");
    const { data: trainings, error: tErr } = await supabase.from('entrenamientos').select('*').limit(3);
    if (tErr) console.error("Training Error:", tErr);
    else console.log("Trainings:", trainings);
}

inspectLinkage();
