
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

async function inspectAttendance() {
    console.log('Testing attendanceService.getAll() query...');

    const { data, error } = await supabase
        .from('asistencia')
        .select('*, entrenamientos(eventos(Tipo, date)), jugadores(name)')
        .limit(5);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    console.log('Records found:', data.length);
    if (data.length > 0) {
        console.log('First record structure:', JSON.stringify(data[0], null, 2));
    } else {
        console.log('No records found in asistencia table.');
    }
}

inspectAttendance();
