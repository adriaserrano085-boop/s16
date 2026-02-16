const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const filePath = 'C:\\Users\\adria\\Desktop\\Actas sub 16\\Acta 04-10-2025 Hospi-Fenix.pdf';

async function main() {
    const buffer = new Uint8Array(fs.readFileSync(filePath));
    const doc = await pdfjsLib.getDocument({ data: buffer }).promise;

    console.log('Pages:', doc.numPages);
    console.log('');

    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map(item => item.str).join(' ');
        console.log(`=== PAGE ${i} ===`);
        console.log(text);
        console.log('');
    }
}

main().catch(console.error);
