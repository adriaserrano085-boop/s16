
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// Using Service Role Key would be better for creating buckets, but we might not have it.
// We'll try with what we have.

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
    console.log("Attempting to create 'Actas' bucket...");

    const { data, error } = await supabase
        .storage
        .createBucket('Actas', {
            public: true, // User wants it to be usable automatically
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['application/pdf']
        });

    if (error) {
        console.error('Error creating bucket:', error);
        console.log('\nFAILED to create bucket automatically.');
        console.log('Please go to Supabase Dashboard > Storage > New Bucket');
        console.log('Name: Actas');
        console.log('Public: Yes');
    } else {
        console.log("Bucket 'Actas' created successfully!");
    }
}

createBucket();
