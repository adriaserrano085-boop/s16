import fs from 'fs';

const SUPABASE_URL = 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';
const API_URL = `${SUPABASE_URL}/rest/v1/eventos?select=*`;

const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

console.log('Fetching from:', API_URL);

try {
    const response = await fetch(API_URL, {
        method: 'GET',
        headers
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
        const text = await response.text();
        console.error('Error response:', text);
    } else {
        const data = await response.json();
        console.log('Total events:', data.length);
        if (data.length > 0) {
            fs.writeFileSync('debug_events.json', JSON.stringify(data, null, 2));
            console.log('Saved events to debug_events.json');

            // Log some examples of Tipos
            const tipos = [...new Set(data.map(e => e.Tipo))];
            console.log('Distinct Tipos:', tipos);
        } else {
            console.log('No events found.');
        }
    }
} catch (e) {
    console.error('Fetch error:', e);
}
