import { readFileSync, existsSync } from 'fs';
import { getDocument } from 'pdfjs-dist';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
    console.warn("Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY not found in env. using fallback.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c');

// --- Arguments ---
const args = process.argv.slice(2);
const PDF_PATH = args[0];
const VIDEO_URL = args[1];
const VIDEO_OFFSET = parseInt(args[2] || '0');

if (!PDF_PATH || !VIDEO_URL) {
    console.error("Usage: node scripts/analyze-match.js <PDF_PATH> <VIDEO_URL> [VIDEO_OFFSET_SEC]");
    process.exit(1);
}

if (!existsSync(PDF_PATH)) {
    console.error(`File not found: ${PDF_PATH}`);
    process.exit(1);
}

// --- PDF Parsing Logic (Adapted from insert-stats-from-pdf.mjs) ---

async function getPageTextStruct(doc, pageNum) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items;

    const lines = {};
    for (const item of items) {
        const text = item.str.trim();
        if (!text) continue;
        const y = Math.round(item.transform[5]);
        if (!lines[y]) lines[y] = [];
        lines[y].push({ x: item.transform[4], text: text });
    }

    const sortedYs = Object.keys(lines).map(Number).sort((a, b) => b - a);
    return sortedYs.map(y => {
        const rowItems = lines[y].sort((a, b) => a.x - b.x);
        return {
            y,
            items: rowItems,
            fullText: rowItems.map(i => i.text).join(' ')
        };
    });
}

function parseMetadata(lines) {
    let date = null;
    let rival = null;
    let isLocal = false;
    let localTeamName = "";
    let visitorTeamName = "";

    for (const line of lines) {
        const dateMatch = line.fullText.match(/El dia:\s+(\d{2}\/\d{2}\/\d{4})/);
        if (dateMatch) date = dateMatch[1];

        if (line.fullText.includes("Equip local:") && line.fullText.includes("Equip visitant:")) {
            const parts = line.fullText.split("Equip visitant:");
            localTeamName = parts[0].replace("Equip local:", "").trim();
            visitorTeamName = parts[1] ? parts[1].trim() : "";

            if (localTeamName.includes("HOSPITALET") || localTeamName.includes("L'H")) {
                isLocal = true;
                rival = visitorTeamName;
            } else {
                isLocal = false;
                rival = localTeamName;
            }
        }
    }
    return { date, rival, isLocal, localTeamName, visitorTeamName };
}

function parseEvents(lines) {
    const events = [];
    let inScoreboard = false;
    let currentTeam = null;

    let typeRow = null;
    let dorsalRow = null;
    let minuteRow = null;

    for (let i = 0; i < lines.length; i++) {
        const text = lines[i].fullText;

        if (text.includes("Marcador")) {
            inScoreboard = true; continue;
        }
        if (text.includes("Incidències") || text.includes("Cambios")) {
            inScoreboard = false;
        }
        if (!inScoreboard) continue;

        if (text.includes("Equip local:")) {
            currentTeam = 'LOCAL';
            typeRow = dorsalRow = minuteRow = null;
        } else if (text.includes("Equip visitant:")) {
            currentTeam = 'VISITOR';
            typeRow = dorsalRow = minuteRow = null;
        }

        const trimmed = text.trim();
        if (trimmed.startsWith("Tipus")) typeRow = lines[i].items;
        else if (trimmed.startsWith("Dorsal")) dorsalRow = lines[i].items;
        else if (trimmed.startsWith("Minut")) minuteRow = lines[i].items;

        if (typeRow && dorsalRow && minuteRow) {
            const types = typeRow.filter(item => !item.text.includes("Tipus") && item.text.trim() !== '*').map(i => i.text.trim());
            const dorsals = dorsalRow.filter(item => !item.text.includes("Dorsal")).map(i => i.text.trim());
            const minutes = minuteRow.filter(item => !item.text.includes("Minut")).map(i => i.text.trim());

            const count = Math.min(types.length, dorsals.length, minutes.length);
            for (let k = 0; k < count; k++) {
                events.push({
                    team: currentTeam,
                    type: types[k],
                    dorsal: parseInt(dorsals[k]),
                    minute: parseInt(minutes[k])
                });
            }
            typeRow = dorsalRow = minuteRow = null;
        }
    }
    return events;
}

// --- Analysis Logic ---

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

function calculateDisciplineCost(events, myTeamSide) { // myTeamSide: 'LOCAL' or 'VISITOR'
    // 1. Find Cards
    const cards = events.filter(e => e.type === 'TA' || e.type === 'TR'); // Yellow / Red

    let costPoints = 0;

    for (const card of cards) {
        const isMyTeam = card.team === myTeamSide;
        // Cost is when MY TEAM gets a card and OPPONENT scores

        if (isMyTeam) {
            const startMin = card.minute;
            const endMin = card.type === 'TA' ? startMin + 10 : 80; // Yellow 10m, Red till end

            // Find opponent scores in this window
            const opponentSide = myTeamSide === 'LOCAL' ? 'VISITOR' : 'LOCAL';
            const opponentScores = events.filter(e =>
                e.team === opponentSide &&
                (e.type === 'A' || e.type === 'T' || e.type === 'CC' || e.type === 'D') &&
                e.minute > startMin && e.minute <= endMin
            );

            // Sum points
            for (const score of opponentScores) {
                let points = 0;
                switch (score.type) {
                    case 'A': points = 5; break; // Ensayo/Try
                    case 'T': points = 2; break; // Transformacion
                    case 'CC': points = 3; break; // Penal
                    case 'D': points = 3; break; // Drop
                }
                costPoints += points;
            }
        }
    }
    return costPoints;
}

// --- Main ---

async function main() {
    console.log("--- Rugby Match Analyst Pro ---");
    console.log(`Processing PDF: ${PDF_PATH}`);

    // 1. Parse PDF
    const buffer = new Uint8Array(readFileSync(PDF_PATH));
    const doc = await getDocument({ data: buffer, useSystemFonts: true }).promise;

    const page1Lines = await getPageTextStruct(doc, 1);
    const metadata = parseMetadata(page1Lines);

    const page2Lines = await getPageTextStruct(doc, 2);
    const rawEvents = parseEvents(page2Lines);

    console.log(`Match: ${metadata.localTeamName} vs ${metadata.visitorTeamName}`);
    console.log(`Date: ${metadata.date}`);
    console.log(`Total Events Parsed: ${rawEvents.length}`);

    // 2. Identify My Team
    // Assuming "Hospitalet" is us.
    const myTeamSide = metadata.isLocal ? 'LOCAL' : 'VISITOR';

    // 3. Process Events & Sync
    const timeline = rawEvents.map(e => {
        // Event Logic
        let eventName = 'Event';
        switch (e.type) {
            case 'A': eventName = 'ENSAYO (Try)'; break;
            case 'T': eventName = 'TRANSFORMACION'; break;
            case 'CC': eventName = 'GOL CASTIGO (Penal)'; break;
            case 'D': eventName = 'DROP'; break;
            case 'TA': eventName = 'TARJETA AMARILLA'; break;
            case 'TR': eventName = 'TARJETA ROJA'; break;
            case 'C': eventName = 'CAMBIO'; break;
        }

        const videoSeconds = (e.minute * 60) + VIDEO_OFFSET;

        // Analysis Window (e.g., for existing tries, look 60s before)
        let analysisStart = null;
        if (e.type === 'A') {
            analysisStart = videoSeconds - 60;
        }

        return {
            minute: e.minute,
            team: e.team,
            isMyTeam: e.team === myTeamSide,
            dorsal: e.dorsal,
            type: e.type,
            description: eventName,
            videoTime: formatTime(videoSeconds),
            videoSeconds: videoSeconds,
            analysisWindowStart: analysisStart ? formatTime(analysisStart) : null
        };
    }).sort((a, b) => a.minute - b.minute);

    // 4. Calculate Metrics
    const disciplineCost = calculateDisciplineCost(rawEvents, myTeamSide);

    // 5. Generate JSON Report
    const report = {
        meta: {
            generated_at: new Date().toISOString(),
            match: `${metadata.localTeamName} vs ${metadata.visitorTeamName}`,
            date: metadata.date,
            video_url: VIDEO_URL,
            video_offset: VIDEO_OFFSET
        },
        metrics: {
            final_score_local: 'TODO: Sum points',
            final_score_visitor: 'TODO: Sum points',
            possession_home_pct: null, // To be filled by analyst
            possession_away_pct: null, // To be filled by analyst
            ruck_speed_avg_sec: null,  // To be filled by analyst
            discipline_cost_points: disciplineCost,
            discipline_notes: `El equipo recibió ${disciplineCost} puntos en contra durante periodos de inferioridad.`
        },
        event_timeline: timeline.map(t => ({
            min: t.minute,
            team: t.team === 'LOCAL' ? 'LOC' : 'VIS',
            dorsal: t.dorsal,
            event: t.description,
            video_timestamp: t.videoTime,
            analyst_note: t.analysisWindowStart ? `REVISAR JUGADA PREVIA: ${t.analysisWindowStart} - ${t.videoTime}` : ''
        }))
    };

    console.log("\n--- JSON ANALYSIS OUTPUT ---");
    console.log(JSON.stringify(report, null, 2));

    // Optional: Save to DB or File
    // For now, we just output to stdout.
}

main().catch(console.error);
