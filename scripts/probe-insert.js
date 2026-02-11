
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function probeInsert() {
    console.log("Probing INSERT into entrenamientos...");

    // Get a valid event ID first
    const { data: events } = await supabase.from('eventos').select('id').limit(1);
    const eventId = events?.[0]?.id;

    if (!eventId) {
        console.error("No events found to test foreign key.");
        return;
    }

    console.log("Using event ID:", eventId);

    // Try insert with 'evento' column
    const payload = {
        evento: eventId,
        calentamiento: 'Test Probe',
        trabajo_separado: 'Test Probe',
        trabajo_conjunto: 'Test Probe'
    };

    const { data, error } = await supabase.from('entrenamientos').insert(payload).select();

    if (error) {
        console.error("Insert Error:", error);
    } else {
        console.log("Insert Success:", data);
        // Clean up
        if (data && data[0]?.id) {
            await supabase.from('entrenamientos').delete().eq('id', data[0].id);
        }
    }
}

probeInsert();
