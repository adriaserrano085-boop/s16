
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('analisis_partido').select('raw_json');
    if (error) {
        console.error(error);
        return;
    }

    data.forEach((row, i) => {
        const root = row.raw_json || {};
        console.log(`\nAnalysis ${i + 1} keys:`, Object.keys(root));
        const nac = root.analisis_video_nac_sport || {};
        if (Object.keys(nac).length > 0) {
            console.log(`  NAC Sport keys:`, Object.keys(nac));
        }
    });
}

check();
