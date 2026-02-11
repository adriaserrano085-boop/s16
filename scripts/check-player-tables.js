
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlayerTables() {
    console.log('--- Checking Player Tables ---');

    // Check 'jugadores'
    console.log("Checking 'jugadores' table...");
    const { data: jugadoresData, error: jugadoresError } = await supabase.from('jugadores').select('*').limit(5);
    if (jugadoresError) {
        console.log("Error accessing 'jugadores':", jugadoresError.message);
    } else {
        console.log(`'jugadores' exists. Count: ${jugadoresData.length}`);
        if (jugadoresData.length > 0) console.log('Sample:', jugadoresData[0]);
    }

    // Check 'jugadores_propios'
    console.log("\nChecking 'jugadores_propios' table...");
    const { data: propiosData, error: propiosError } = await supabase.from('jugadores_propios').select('*').limit(5);
    if (propiosError) {
        console.log("Error accessing 'jugadores_propios':", propiosError.message);
    } else {
        console.log(`'jugadores_propios' exists. Count: ${propiosData.length}`);
        if (propiosData.length > 0) console.log('Sample:', propiosData[0]);
    }
}

checkPlayerTables();
