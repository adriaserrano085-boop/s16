
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

async function debugRelationships() {
    console.log('1. Testing asistencia -> entrenamientos join...');
    const { data: step1, error: error1 } = await supabase
        .from('asistencia')
        .select('*, entrenamientos(*)')
        .limit(1);

    if (error1) {
        console.error('Step 1 Failed:', error1.message);
        console.log('Trying alias "entrenamiento"...'); // Column name
        const { data: step1_2, error: error1_2 } = await supabase
            .from('asistencia')
            .select('*, entrenamiento(*)')
            .limit(1);
        if (error1_2) console.error('Step 1.2 Failed:', error1_2.message);
        else console.log('Step 1.2 Success!');
    } else {
        console.log('Step 1 Success!');
        if (step1.length > 0) {
            console.log('Sample record:', JSON.stringify(step1[0], null, 2));
        }
    }

    console.log('2. Testing entrenamientos -> eventos join...');
    const { data: step2, error: error2 } = await supabase
        .from('entrenamientos')
        .select('*, eventos(*)')
        .limit(1);

    if (error2) {
        console.error('Step 2 Failed:', error2.message);
        console.log('Trying alias "evento"...'); // Column name
        const { data: step2_2, error: error2_2 } = await supabase
            .from('entrenamientos')
            .select('*, evento(*)')
            .limit(1);
        if (error2_2) console.error('Step 2.2 Failed:', error2_2.message);
        else console.log('Step 2.2 Success!');
    } else {
        console.log('Step 2 Success!');
    }
}

debugRelationships();
