
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEntrenamientos() {
    const { data, error } = await supabase
        .from('entrenamientos')
        .select('id_entrenamiento, evento')
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Sample Entrenamientos:', data);

    if (data.length > 0) {
        const sampleEvento = data[0].evento;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sampleEvento);
        console.log('Is Evento a UUID?', isUUID);
    }
}

checkEntrenamientos();
