
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('Inspecting asistencia columns...');
    const { data: asistencia, error: err1 } = await supabase
        .from('asistencia')
        .select('*')
        .limit(1);

    if (err1) console.error(err1);
    else console.log('Asistencia sample:', asistencia);

    console.log('Inspecting entrenamientos columns...');
    const { data: entrenamientos, error: err2 } = await supabase
        .from('entrenamientos')
        .select('*')
        .limit(1);

    if (err2) console.error(err2);
    else console.log('Entrenamientos sample:', entrenamientos);

    console.log('Inspecting eventos columns...');
    const { data: eventos, error: err3 } = await supabase
        .from('eventos')
        .select('*')
        .limit(1);

    if (err3) console.error(err3);
    else console.log('Eventos sample:', eventos);
}

inspectSchema();
