
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as pdfjsLib from 'pdfjs-dist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPdf() {
    console.log('Fetching latest match PDF...');

    const { data, error } = await supabase
        .from('partidos')
        .select('id, acta_url')
        .not('acta_url', 'is', null)
        .order('id', { ascending: false })
        .limit(1);

    if (!data || data.length === 0) {
        console.error('No acta found.');
        return;
    }

    const url = data[0].acta_url;
    console.log('Downloading:', url);

    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
    console.log(`PDF Loaded. Pages: ${doc.numPages}`);

    if (doc.numPages < 2) {
        console.log('PDF has less than 2 pages. Cards usually on page 2.');
        return;
    }

    console.log('--- PAGE 2 CONTENT ---');
    const page = await doc.getPage(2);
    const content = await page.getTextContent();

    const items = content.items;
    const lines = {};

    for (const item of items) {
        if (!item.str.trim()) continue;
        const y = Math.round(item.transform[5]);
        if (!lines[y]) lines[y] = [];
        lines[y].push({ x: item.transform[4], text: item.str, width: item.width });
    }

    const sortedYs = Object.keys(lines).map(Number).sort((a, b) => b - a);

    for (const y of sortedYs) {
        const rowText = lines[y].sort((a, b) => a.x - b.x).map(i => i.text).join(' ');
        console.log(`[Y=${y}] ${rowText}`);
    }
    console.log('--- END PAGE 2 ---');
}

debugPdf();
