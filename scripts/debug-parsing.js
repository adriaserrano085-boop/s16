
// Reproduction of parseEvents logic from ActaUploader.jsx

function parseEvents(lines) {
    const events = [];
    const substitutions = [];

    let inScoreboard = false;
    let inChanges = false;
    let inCards = false;
    let currentTeam = null;

    let typeRow = null;
    let dorsalRow = null;
    let dorsalInRow = null;
    let dorsalOutRow = null;
    let minuteRow = null;

    for (let i = 0; i < lines.length; i++) {
        const text = lines[i].fullText;
        console.log(`Processing Line detected: ${text}`);

        // Section Detection
        if (text.includes("Marcador")) {
            console.log("-> Engaged Scoreboard");
            inScoreboard = true; inChanges = false; inCards = false; currentTeam = null; continue;
        }
        if (text.includes("Cambios")) {
            console.log("-> Engaged Changes");
            inScoreboard = false; inChanges = true; inCards = false; currentTeam = null; continue;
        }
        if (text.includes("Expulsions") || text.includes("Incidències") || text.includes("Targetes")) {
            console.log("-> Engaged Cards. CurrentTeam RESET to null.");
            inScoreboard = false; inChanges = false; inCards = true; currentTeam = null; continue;
        }
        if (text.includes("Observacions")) {
            console.log("-> Engaged Observations. STOP.");
            inScoreboard = false; inChanges = false; inCards = false; continue;
        }

        // Team Detection
        if (text.includes("Equip local:")) {
            console.log("-> Detected LOCAL Team");
            currentTeam = 'LOCAL';
            typeRow = dorsalRow = dorsalInRow = dorsalOutRow = minuteRow = null;
        } else if (text.includes("Equip visitant:")) {
            console.log("-> Detected VISITOR Team");
            currentTeam = 'VISITOR';
            typeRow = dorsalRow = dorsalInRow = dorsalOutRow = minuteRow = null;
        }

        if (!currentTeam) {
            console.log("-> Skipping (No Current Team)");
            continue;
        }

        // Row detection
        const trimmed = text.trim();
        if (trimmed.startsWith("Tipus")) typeRow = lines[i].items;
        else if (trimmed.startsWith("Dorsal") && !trimmed.startsWith("Dorsal entra") && !trimmed.startsWith("Dorsal surt")) dorsalRow = lines[i].items;
        else if (trimmed.startsWith("Minut")) minuteRow = lines[i].items;

        // Parse Block: Cards
        if (inCards && typeRow && dorsalRow && minuteRow) {
            console.log(`-> Parsing CARD ROW for ${currentTeam}`);
            const typeItems = typeRow.filter(item => !item.text.includes("Tipus") && item.text.trim() !== '*');
            const dorsalItems = dorsalRow.filter(item => !item.text.includes("Dorsal"));
            const minuteItems = minuteRow.filter(item => !item.text.includes("Minut"));

            const count = Math.min(typeItems.length, dorsalItems.length, minuteItems.length);

            for (let k = 0; k < count; k++) {
                const dorsalItem = dorsalItems[k];
                const dorsal = parseInt(dorsalItem.text.trim());

                let actualType = 'TA';
                if (dorsalItem.x > 350) {
                    actualType = 'TR';
                }

                if (!isNaN(dorsal)) {
                    events.push({
                        team: currentTeam,
                        type: actualType,
                        dorsal: dorsal,
                        minute: parseInt(minuteItems[k].text.trim())
                    });
                }
            }
            typeRow = dorsalRow = minuteRow = null;
        }
    }
    return { events, substitutions };
}

// Mock Data based on Debug Output
const mockLines = [
    { fullText: "Expulsions temporals Expulsions definitives", items: [] }, // Y=400
    { fullText: "Equip local: RC L'HOSPITALET Equip local: RC L'HOSPITALET", items: [] }, // Y=388
    { fullText: "Tipus * D Tipus *", items: [{ text: "Tipus", x: 10 }, { text: "D", x: 50 }, { text: "Tipus", x: 400 }] }, // Y=376
    { fullText: "Dorsal 6 Dorsal", items: [{ text: "Dorsal", x: 10 }, { text: "6", x: 50 }, { text: "Dorsal", x: 400 }] }, // Y=364
    { fullText: "Minut 60 Minut", items: [{ text: "Minut", x: 10 }, { text: "60", x: 50 }, { text: "Minut", x: 400 }] }, // Y=352

    // VISITOR BLOCK
    { fullText: "Equip visitant: FÉNIX Equip visitant: FÉNIX", items: [] }, // Y=313
    { fullText: "Tipus * D B Tipus *", items: [{ text: "Tipus", x: 10 }, { text: "D", x: 50 }, { text: "B", x: 80 }, { text: "Tipus", x: 400 }] }, // Y=302
    { fullText: "Dorsal 62 33 Dorsal", items: [{ text: "Dorsal", x: 10 }, { text: "62", x: 50 }, { text: "33", x: 80 }, { text: "Dorsal", x: 400 }] }, // Y=290
    { fullText: "Minut 15 58 Minut", items: [{ text: "Minut", x: 10 }, { text: "15", x: 50 }, { text: "58", x: 80 }, { text: "Minut", x: 400 }] } // Y=278
];

const result = parseEvents(mockLines);
console.log("-------------------");
console.log("FINAL EVENTS:", JSON.stringify(result.events, null, 2));
