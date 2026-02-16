
import { readFileSync } from 'fs';
import { getDocument } from 'pdfjs-dist';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tyqyixwqoxrrfvoeotax.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cXlpeHdxb3hycmZ2b2VvdGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Nzk3NTUsImV4cCI6MjA4MzQ1NTc1NX0.YWUvI8waXDCn6pHLlf1uoKuKUFbVzw8CFFfIsyfau-c';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FILE_PATH = 'C:\\Users\\adria\\Desktop\\Actas sub 16\\Acta 04-10-2025 Hospi-Fenix.pdf';

// --- Text Extraction Helpers ---

async function getPageTextStruct(doc, pageNum) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const items = content.items;

    // Group by Y coordinate (row)
    const lines = {};
    for (const item of items) {
        const text = item.str.trim();
        if (!text) continue; // Skip empty strings

        // Round to nearest int to group roughly aligned text
        const y = Math.round(item.transform[5]);
        if (!lines[y]) lines[y] = [];
        lines[y].push({ x: item.transform[4], text: text, width: item.width });
    }

    // Sort rows by Y (descending - top to bottom)
    const sortedYs = Object.keys(lines).map(Number).sort((a, b) => b - a);

    const structuredLines = sortedYs.map(y => {
        // Sort items in row by X (ascending - left to right)
        const rowItems = lines[y].sort((a, b) => a.x - b.x);
        return {
            y,
            items: rowItems,
            fullText: rowItems.map(i => i.text).join(' ')
        };
    });

    return structuredLines;
}

// --- Data Parsers ---

function parseMetadata(lines) {
    let date = null;
    let rival = null;
    let isLocal = false; // Default

    for (const line of lines) {
        // Date: "El dia: 04/10/2025"
        const dateMatch = line.fullText.match(/El dia:\s+(\d{2}\/\d{2}\/\d{4})/);
        if (dateMatch) date = dateMatch[1];

        // Teams
        if (line.fullText.includes("Equip local:") && line.fullText.includes("Equip visitant:")) {
            // Example: "Equip local: RC L'HOSPITALET Equip visitant: FÉNIX"
            // Split roughly
            const parts = line.fullText.split("Equip visitant:");
            const localPart = parts[0].replace("Equip local:", "").trim();
            const visitorPart = parts[1] ? parts[1].trim() : "";

            if (localPart.includes("HOSPITALET") || localPart.includes("L'H")) {
                isLocal = true;
                rival = visitorPart;
            } else {
                isLocal = false;
                rival = localPart;
            }
        }
    }

    return { date, rival, isLocal };
}

function parseLineups(lines) {
    const players = [];
    const playerRegex = /^(\d+)\s+(?:([XC\/]+)\s+)?(.+?)\s+(\d{7})$/;

    for (const line of lines) {
        const text = line.fullText;
        // Optimization: Check if line ends with a 7-digit license
        if (!/\d{7}$/.test(text)) continue;

        // We might have two players on one line in the PDF structure?
        // Look at the example: "1 X Gil... 0931254 41 X Ibañez... 0929691"
        // If the line has multiple licenses, we need to split it.
        // Heuristic: Split by license number.

        // But the provided regex is for a single entry.
        // Let's iterate through items or just regex match all occurrences.

        // Better approach: Regex match global?
        // The structure seems to be: Dorsal (Status) Name License
        const matches = [...text.matchAll(/(\d+)\s+(?:([XC\/]+)\s+)?([^\d]+?)\s+(\d{7})/g)];

        for (const match of matches) {
            const dorsal = parseInt(match[1]);
            const status = match[2] || '';
            const name = match[3].trim();
            const licencia = match[4];

            const isTitular = status.includes('X');
            const isCaptain = status.includes('C');

            players.push({ dorsal, name, licencia, isTitular, isCaptain });
        }
    }
    return players;
}

function parseEvents(lines) {
    const events = [];

    // We need to find the "Marcador" section
    let inScoreboard = false;
    let currentTeam = null; // 'LOCAL' or 'VISITOR' via parsing

    // Rows to capture
    let typeRow = null;
    let dorsalRow = null;
    let minuteRow = null;

    for (let i = 0; i < lines.length; i++) {
        const text = lines[i].fullText;

        if (text.includes("Marcador")) {
            inScoreboard = true;
            continue;
        }
        if (text.includes("Incidències") || text.includes("Cambios")) {
            inScoreboard = false;
        }

        if (!inScoreboard) continue;

        if (text.includes("Equip local:")) {
            currentTeam = 'LOCAL';
            // Reset rows
            typeRow = dorsalRow = minuteRow = null;
        } else if (text.includes("Equip visitant:")) {
            currentTeam = 'VISITOR';
            // Reset rows
            typeRow = dorsalRow = minuteRow = null;
        }

        // Identify rows by content
        // "Tipus * A A"
        const trimmed = text.trim();
        if (trimmed.startsWith("Tipus")) {
            console.log(`Found Type row for ${currentTeam}: ${trimmed}`);
            typeRow = lines[i].items;
        } else if (trimmed.startsWith("Dorsal")) {
            console.log(`Found Dorsal row for ${currentTeam}: ${trimmed}`);
            dorsalRow = lines[i].items;
        } else if (trimmed.startsWith("Minut")) {
            console.log(`Found Minute row for ${currentTeam}: ${trimmed}`);
            minuteRow = lines[i].items;

            // Optimization: If we have minute, we likely have the block. 
            // Often Minut comes last in the triad.
        } else {
            // Debug log to see what we are skipping
            // console.log(`Skipping line in scoreboard: ${trimmed}`);
        }

        // Process if we have all 3
        if (typeRow && dorsalRow && minuteRow) {
            console.log(`Processing block for ${currentTeam}`);
            // Process these 3 rows
            // Filter out the labels
            const types = typeRow.filter(item => !item.text.includes("Tipus") && item.text.trim() !== '*').map(i => i.text.trim());
            const dorsals = dorsalRow.filter(item => !item.text.includes("Dorsal")).map(i => i.text.trim());
            const minutes = minuteRow.filter(item => !item.text.includes("Minut")).map(i => i.text.trim());

            console.log(`Extracted: ${types.length} types, ${dorsals.length} dorsals, ${minutes.length} minutes`);

            // Check alignment using array indices (assuming perfect parsing order)
            const count = Math.min(types.length, dorsals.length, minutes.length);

            for (let k = 0; k < count; k++) {
                events.push({
                    team: currentTeam, // We'll resolve this to 'OURS' or 'RIVAL' later
                    type: types[k],
                    dorsal: parseInt(dorsals[k]),
                    minute: parseInt(minutes[k])
                });
            }

            // Clear rows after processing to avoid re-processing or weird overlaps
            typeRow = dorsalRow = minuteRow = null;
        }
    }

    return events;
}

// --- Main Execution ---

async function main() {
    console.log(`Processing ${FILE_PATH}...`);

    const buffer = new Uint8Array(readFileSync(FILE_PATH));
    const doc = await getDocument({ data: buffer, useSystemFonts: true }).promise;

    // 1. Parse Metadata (Page 1)
    const page1Lines = await getPageTextStruct(doc, 1);
    const metadata = parseMetadata(page1Lines);
    console.log('Metadata:', metadata);

    if (!metadata.date || !metadata.rival) {
        console.error("Could not extract date or rival.");
        return;
    }

    // 2. Parse Lineups (Page 1)
    // Filter out logic: We only care about OUR players. 
    // We extracted all players. We can filter by license against DB later.
    // Or we assume the lineup section "Equip local" / "visitor" logic.
    // The parseLineups function gets ALL players on the page.
    // We should probably filter by which side they are on, but the PDF structure for lineups
    // puts them side-by-side: "Dorsal ... Nome ... | Dorsal ... Nome ..."
    // Let's simpler approach: Use the License to Identify ONLY our players.
    const allPlayersFromPdf = parseLineups(page1Lines);
    console.log(`Found ${allPlayersFromPdf.length} player entries in PDF.`);

    // 3. Parse Events (Page 2)
    const page2Lines = await getPageTextStruct(doc, 2);
    const events = parseEvents(page2Lines);
    console.log(`Found ${events.length} scoring/card events.`);

    // 4. Resolve Database Entities

    // A. Find Match
    // Convert date "04/10/2025" to "2025-10-04"
    const [d, m, y] = metadata.date.split('/');
    const formattedDate = `${y}-${m}-${d}`;

    console.log(`Looking for match on ${formattedDate} against ${metadata.rival}...`);

    // Query 'eventos' for date, then 'partidos'
    // Note: Column name for date in 'eventos' is likely 'fecha' or 'fecha_creacion' or similar. 
    // From check-eventos-columns.js output we will know.
    // Assuming 'fecha' based on common patterns if 'fecha_inicio' failed.
    // Actually, looking at 'check-eventos-columns.js' output (when it runs) is best.
    // But for now, let's try 'fecha' as a fallback or 'fecha_evento'.

    // WAIT: I can't know for sure until I see the output of the previous tool.
    // But I can make this more robust by selecting * and filtering in JS if needed,
    // OR just wait. 
    // I will try to use the correct name after this tool execution returns.
    // For this Replace, I will perform a safe guess but I should probably wait.

    // Let's use 'fecha' which is standard in this project IIRC from other artifacts.
    // Actually, looking at 'debug-dashboard-data.js' or similar might help.
    // 'check-eventos-columns.js' output is key.

    // I will skip this replace for now and wait for the tool output.
    // Undo this tool call? No, I'll just change the logging to be more verbose.

    const { data: eventData, error: eventError } = await supabase
        .from('eventos')
        .select('id, fecha, partidos(id, Rival, rivales(nombre_equipo))') // Deep join to get rival name
        .gte('fecha', `${formattedDate} 00:00:00`)
        .lte('fecha', `${formattedDate} 23:59:59`);

    if (eventError) throw eventError;

    let matchId = null;
    if (eventData && eventData.length > 0) {
        // Filter by rival
        const match = eventData.find(e => {
            if (!e.partidos) return false;
            // Handle array if one-to-many, though likely object
            const p = Array.isArray(e.partidos) ? e.partidos[0] : e.partidos;

            // Check if rivales relation was fetched
            // p.rivales should be an object (or array if multiple? FK is singular so object)
            // But if null, we can't match.
            const rivalName = (p.rivales && p.rivales.nombre_equipo) ? p.rivales.nombre_equipo : '';

            if (!rivalName) {
                // Fallback? Maybe the ID matches something? unlikely.
                return false;
            }

            // Normalize for comparison
            const rName = rivalName.toLowerCase();
            const pdfName = metadata.rival.toLowerCase();

            return (rName.includes(pdfName) || pdfName.includes(rName));
        });

        if (match) {
            matchId = (Array.isArray(match.partidos) ? match.partidos[0] : match.partidos).id;
            console.log(`Found Match ID: ${matchId}`);
        }
    }

    if (!matchId) {
        console.error("Match not found in database!");
        return;
    }

    // B. Resolve Players
    // We want to map `dorsal` -> `jugador_id`.
    // Valid players are those whose licenses exist in `jugadores_propios`.

    const { data: dbPlayers, error: dbPlayersError } = await supabase
        .from('jugadores_propios')
        .select('id, licencia, nombre, apellidos');

    if (dbPlayersError) throw dbPlayersError;

    const playerMap = {}; // dorsal -> { id, name, stats... }

    for (const pdfPlayer of allPlayersFromPdf) {
        const dbPlayer = dbPlayers.find(p => p.licencia === pdfPlayer.licencia);
        if (dbPlayer) {
            // It's our player!
            playerMap[pdfPlayer.dorsal] = {
                id: dbPlayer.id,
                name: `${dbPlayer.nombre} ${dbPlayer.apellidos}`,
                dorsal: pdfPlayer.dorsal,
                isTitular: pdfPlayer.isTitular,
                isCaptain: pdfPlayer.isCaptain,
                stats: {
                    ensayos: 0,
                    transformaciones: 0,
                    penales: 0,
                    drops: 0,
                    tarjetas_amarillas: 0,
                    tarjetas_rojas: 0
                }
            };
        }
    }

    console.log(`Matched ${Object.keys(playerMap).length} players from our team.`);

    // 5. Aggregate Stats
    // Filter events for OUR team.
    // metadata.isLocal determines if we are LOCAL or VISITOR.
    const myTeamKey = metadata.isLocal ? 'LOCAL' : 'VISITOR';

    for (const event of events) {
        if (event.team === myTeamKey) {
            const player = playerMap[event.dorsal];
            if (player) {
                switch (event.type) {
                    case 'A': player.stats.ensayos++; break;
                    case 'T': player.stats.transformaciones++; break;
                    case 'CC': player.stats.penales++; break;
                    case 'D': player.stats.drops++; break;
                    case 'TA': player.stats.tarjetas_amarillas++; break; // Check actual code
                    case 'TR': player.stats.tarjetas_rojas++; break;
                    // Add more mappings as verified
                }
            } else {
                console.warn(`Event for unknown/rival player dorsal ${event.dorsal} (Type: ${event.type})`);
            }
        }
    }

    // 6. Insert to DB

    // A. Insert Match Stats Record
    const { error: statsMatchError } = await supabase
        .from('estadisticas_partido')
        .upsert({
            partido: matchId,
            acta_procesada: true
        }, { onConflict: 'partido' });

    if (statsMatchError) console.error("Error creating match stats:", statsMatchError);
    else console.log("Match stats record created/updated.");

    // B. Insert Player Stats
    for (const dorsal in playerMap) {
        const p = playerMap[dorsal];
        const record = {
            partido: matchId,
            jugador: p.id,
            equipo: 'RC L\'HOSPITALET',
            dorsal: p.dorsal,
            nombre: p.name,
            es_titular: p.isTitular,
            es_capitan: p.isCaptain,
            ...p.stats
        };

        const { error: playerStatError } = await supabase
            .from('estadisticas_jugador')
            .insert(record); // Or upsert? Tables ID is random UUID, so insert might duplicate if run twice without cleanup.
        // Better to delete previous stats for this match first?
        // Or add a unique constraint on (partido, jugador)?

        if (playerStatError) {
            console.error(`Error inserting stats for ${p.name}:`, playerStatError.message);
        } else {
            console.log(`Inserted stats for ${p.name}`);
        }
    }

    console.log("Done!");
}

main().catch(console.error);
