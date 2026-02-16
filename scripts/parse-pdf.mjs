import { readFileSync } from 'fs';
import { getDocument } from 'pdfjs-dist';

const filePath = 'C:\\Users\\adria\\Desktop\\Actas sub 16\\Acta 04-10-2025 Hospi-Fenix.pdf';

const buffer = new Uint8Array(readFileSync(filePath));
const doc = await getDocument({ data: buffer, useSystemFonts: true }).promise;

// Only page 1
const page = await doc.getPage(1);
const content = await page.getTextContent();

const items = content.items;
const lines = {};
for (const item of items) {
    const y = Math.round(item.transform[5]);
    if (!lines[y]) lines[y] = [];
    lines[y].push({ x: item.transform[4], text: item.str });
}

const sortedYs = Object.keys(lines).map(Number).sort((a, b) => b - a);

console.log(`=== PAGE 2 ===`);
for (const y of sortedYs) {
    const lineItems = lines[y].sort((a, b) => a.x - b.x);
    const lineText = lineItems.map(i => i.text).join('  ');
    if (lineText.trim()) console.log(lineText);
}
