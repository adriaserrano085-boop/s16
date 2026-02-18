
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load env vars
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAnalysisData() {
    console.log("Checking analisis_partido table...");

    // 1. Get all analysis entries
    const { data: analysis, error } = await supabase
        .from('analisis_partido')
        .select('*');

    if (error) {
        console.error("Error fetching analysis:", error);
        return;
    }

    console.log(`Found ${analysis.length} analysis records.`);

    if (analysis.length > 0) {
        console.log("Sample Record:", JSON.stringify(analysis[0], null, 2));
    } else {
        console.log("No analysis data found. The Save functionality might be failing, or looking at wrong IDs.");
    }

    // 2. Check connections with 'partidos'
    if (analysis.length > 0) {
        const sample = analysis[0];
        if (sample.evento_id) {
            console.log(`Checking Evento ID: ${sample.evento_id}`);
            const { data: event } = await supabase.from('eventos').select('*').eq('id', sample.evento_id);
            console.log("Linked Event:", event);
        }
    }
}

checkAnalysisData();
