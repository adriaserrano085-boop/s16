
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMixedTypes() {
    const { data: trainings, error } = await supabase
        .from('entrenamientos')
        .select('evento')
        .limit(50);

    if (error) console.error(error);

    if (trainings) {
        console.log("Checking first 50 trainings for mixed types:");
        trainings.forEach(t => {
            const isUUID = t.evento && t.evento.length === 36;
            console.log(`Evento: ${t.evento}, Likely UUID: ${isUUID}`);
        });
    }
}

checkMixedTypes();
