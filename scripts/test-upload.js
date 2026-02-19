
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
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
    console.log('Testing upload to "Actas" bucket...');

    const testFile = new Blob(['Test content'], { type: 'text/plain' });
    const fileName = `test_file_${Date.now()}.txt`;

    const { data, error } = await supabase.storage
        .from('Actas')
        .upload(fileName, testFile);

    if (error) {
        console.error('Upload Error:', error);
        console.log('\nResult: FAILED - Permission Issue Likely.');
    } else {
        console.log('Result: SUCCESS - File uploaded:', data.path);

        // Verify public URL
        const { data: urlData } = supabase.storage
            .from('Actas')
            .getPublicUrl(data.path);

        console.log('Public URL:', urlData.publicUrl);
    }
}

testUpload();
