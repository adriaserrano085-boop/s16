
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
    console.log('Checking RLS policies requires SQL access or inference.');
    console.log('Trying to fetch "entrenamientos" as anon...');

    const { data, error } = await supabase
        .from('entrenamientos')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Error fetching entrenamientos:', error);
    } else {
        console.log(`Success! Fetched ${data.length} records.`);
        console.log('Sample:', data[0]);
    }
}

checkPolicies();
