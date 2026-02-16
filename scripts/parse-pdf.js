const fs = require('fs');
const pdf = require('pdf-parse');

const filePath = 'C:\\Users\\adria\\Desktop\\Actas sub 16\\Acta 04-10-2025 Hospi-Fenix.pdf';

async function main() {
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);
    console.log('=== PDF TEXT ===');
    console.log(data.text);
    console.log('=== END ===');
}

main().catch(console.error);
