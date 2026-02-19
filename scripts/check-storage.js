
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

async function checkStorage() {
    console.log('Checking Storage Buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }

    console.log('Buckets found:', buckets.map(b => b.name));

    const itemsBucket = buckets.find(b => b.name === 'Actas' || b.name === 'actas');
    if (!itemsBucket) {
        console.error("Bucket 'Actas' NOT found!");
    } else {
        console.log(`Bucket '${itemsBucket.name}' found.`);
        // Try to list files
        const { data: files, error: listError } = await supabase.storage.from(itemsBucket.name).list();
        if (listError) console.error('Error listing files in Actas:', listError);
        else console.log(`Files in ${itemsBucket.name}:`, files.length);
    }
}

checkStorage();
