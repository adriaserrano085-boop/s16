import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTrainingColumns() {
    console.log('Fetching one event ID...');
    const { data: events, error: eventError } = await supabase
        .from('eventos')
        .select('id')
        .limit(1);

    if (eventError || !events || events.length === 0) {
        console.error('Could not fetch event to test with.', eventError);
        return;
    }

    const eventId = events[0].id;
    console.log('Testing with Event ID:', eventId);

    // Test lowercase 'evento'
    console.log("Attempting insert with 'evento'...");
    const { error: error1 } = await supabase
        .from('entrenamientos')
        .insert({
            evento: eventId,
            calentamiento: 'Test',
            trabajo_separado: 'Test',
            trabajo_conjunto: 'Test'
        });

    if (error1) {
        console.log("Error with 'evento':", error1.message);
    } else {
        console.log("Success with 'evento'!");
        // Clean up
        await supabase.from('entrenamientos').delete().eq('evento', eventId);
        return;
    }

    // Test capitalized 'Evento'
    console.log("Attempting insert with 'Evento'...");
    const { error: error2 } = await supabase
        .from('entrenamientos')
        .insert({
            Evento: eventId,
            calentamiento: 'Test',
            trabajo_separado: 'Test',
            trabajo_conjunto: 'Test'
        });

    if (error2) {
        console.log("Error with 'Evento':", error2.message);
    } else {
        console.log("Success with 'Evento'!");
        // Clean up
        await supabase.from('entrenamientos').delete().eq('Evento', eventId);
    }
}

testTrainingColumns();
