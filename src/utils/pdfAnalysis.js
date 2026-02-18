import * as pdfjsLib from 'pdfjs-dist';

// Helper to set up worker
// In Vite, we often need to point to the worker file in public or node_modules
// A common pattern is importing the worker entry point.
// However, pdfjs-dist 4.x has specific worker handling.
// Let's try to rely on the user having configured it or use a CDN fallback if locally failing?
// Or better: Use the standard import syntax which Vite handles.
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// --- Parsing Logic (Ported from analyze-match.js) ---

async function getPageTextStruct(doc, pageNum) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items;

    const lines = {};
    for (const item of items) {
        const text = item.str.trim();
        if (!text) continue;
        // Transform[5] is Y position
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

function calculateDisciplineCost(events, myTeamSide) {
    const cards = events.filter(e => e.type === 'TA' || e.type === 'TR');
    let costPoints = 0;

    for (const card of cards) {
        const isMyTeam = card.team === myTeamSide;
        if (isMyTeam) {
            const startMin = card.minute;
            const endMin = card.type === 'TA' ? startMin + 10 : 80;

            const opponentSide = myTeamSide === 'LOCAL' ? 'VISITOR' : 'LOCAL';
            const opponentScores = events.filter(e =>
                e.team === opponentSide &&
                (e.type === 'A' || e.type === 'T' || e.type === 'CC' || e.type === 'D') &&
                e.minute > startMin && e.minute <= endMin
            );

            for (const score of opponentScores) {
                let points = 0;
                switch (score.type) {
                    case 'A': points = 5; break;
                    case 'T': points = 2; break;
                    case 'CC': points = 3; break;
                    case 'D': points = 3; break;
                }
                costPoints += points;
            }
        }
    }
    return costPoints;
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

// --- Main Export ---

export const analyzePdf = async (file, videoOffsetSec = 0) => {
    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // 1. Metadata
    const page1Lines = await getPageTextStruct(doc, 1);
    const metadata = parseMetadata(page1Lines);

    // 2. Events
    const page2Lines = await getPageTextStruct(doc, 2);
    const rawEvents = parseEvents(page2Lines);

    // 3. Logic
    const myTeamSide = metadata.isLocal ? 'LOCAL' : 'VISITOR';

    // Timeline
    const timeline = rawEvents.map(e => {
        let eventName = 'Event';
        switch (e.type) {
            case 'A': eventName = 'ENSAYO (Try)'; break;
            case 'T': eventName = 'TRANSFORMACION'; break;
            case 'CC': eventName = 'GOL CASTIGO'; break;
            case 'D': eventName = 'DROP'; break;
            case 'TA': eventName = 'TARJETA AMARILLA'; break;
            case 'TR': eventName = 'TARJETA ROJA'; break;
            case 'C': eventName = 'CAMBIO'; break;
        }

        const videoSeconds = (e.minute * 60) + videoOffsetSec;
        let analysisStart = null;
        if (e.type === 'A') {
            analysisStart = videoSeconds - 60;
        }

        return {
            minute: e.minute,
            team: e.team, // 'LOCAL' or 'VISITOR'
            team_label: e.team === 'LOCAL' ? 'L' : 'V',
            isMyTeam: e.team === myTeamSide,
            dorsal: e.dorsal,
            type: e.type,
            description: eventName,
            videoTime: formatTime(videoSeconds),
            videoSeconds: videoSeconds,
            analysisWindowStart: analysisStart ? formatTime(analysisStart) : null
        };
    }).sort((a, b) => a.minute - b.minute);

    const disciplineCost = calculateDisciplineCost(rawEvents, myTeamSide);

    return {
        metadata,
        timeline,
        disciplineCost
    };
};
