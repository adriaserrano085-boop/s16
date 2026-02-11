import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    const logFile = path.resolve(__dirname, 'schema_output.txt');
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync(logFile, (typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg) + '\n');
    };
    // Clear file
    fs.writeFileSync(logFile, '');

    try {
        const envPath = path.resolve(__dirname, '../.env');
        const envContent = fs.readFileSync(envPath, 'utf8');

        const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
        const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

        if (!urlMatch || !keyMatch) {
            log('Could not find VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
            return;
        }

        const SUPABASE_URL = urlMatch[1].trim();
        const SUPABASE_KEY = keyMatch[1].trim();

        const headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json'
        };

        log('--- Inspecting Entrenamientos ---');
        const trainRes = await fetch(`${SUPABASE_URL}/rest/v1/entrenamientos?select=*&limit=1`, { headers });
        if (trainRes.ok) {
            const trainData = await trainRes.json();
            if (trainData.length > 0) {
                log('Columns: ' + JSON.stringify(Object.keys(trainData[0])));
            } else {
                log('Table Entrenamientos is empty.');
            }
        } else {
            log('Error fetching entrenamientos: ' + await trainRes.text());
        }

        log('\n--- Inspecting Partidos ---');
        const matchRes = await fetch(`${SUPABASE_URL}/rest/v1/partidos?select=*&limit=1`, { headers });
        if (matchRes.ok) {
            const matchData = await matchRes.json();
            if (matchData.length > 0) {
                log('Columns: ' + JSON.stringify(Object.keys(matchData[0])));
            } else {
                log('Table Partidos is empty.');
            }
        } else {
            log('Error fetching partidos: ' + await matchRes.text());
        }

    } catch (err) {
        log('Script error: ' + err);
    }
}

run();
