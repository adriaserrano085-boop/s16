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

async function inspectTrainingsSchema() {
    console.log('Fetching one record from "entrenamientos" to inspect columns...');

    const { data, error } = await supabase
        .from('entrenamientos')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching entrenamientos:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns in "entrenamientos":', Object.keys(data[0]));
        console.log('Sample record:', data[0]);
    } else {
        console.log('No records found in "entrenamientos".');
    }
}

inspectTrainingsSchema();
