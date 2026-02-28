
import React, { useState } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, API_BASE_URL } from '../lib/apiClient';
const ActaUploader = ({ onUploadComplete }) => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setStatus('Leyendo PDF...');
        setError(null);

        try {
            // 1. Upload File to our Backend
            setStatus('Subiendo archivo PDF al servidor...');
            const formData = new FormData();
            formData.append('file', file);

            const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('s16_auth_token')}`
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json().catch(() => ({}));
                throw new Error(errorData.detail || "Error al subir el archivo al servidor");
            }

            const uploadData = await uploadResponse.json();
            const publicUrl = uploadData.full_url || uploadData.url;
            console.log("File uploaded successfully to:", publicUrl);

            setStatus('Leyendo PDF...');
            const arrayBuffer = await file.arrayBuffer();
            const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            setStatus('Extracting metadata...');
            // Parse Page 1
            const page1Lines = await getPageTextStruct(doc, 1);
            const metadata = parseMetadata(page1Lines);
            console.log('Metadata:', metadata);

            if (!metadata.date || !metadata.rival) {
                throw new Error("No se pudo extraer la fecha o el rival del PDF.");
            }

            setStatus(`Buscando partido contra ${metadata.rival} (${metadata.date})...`);
            const matchInfo = await findMatch(metadata); // Returns { id, type }

            if (!matchInfo || !matchInfo.id) {
                throw new Error(`Error al buscar o crear el partido.`);
            }

            setStatus('Procesando alineación...');

            setStatus('Procesando alineación...');
            const playerLists = parseLineups(page1Lines);

            setStatus('Resolviendo jugadores...');
            const playerMap = await resolvePlayers(playerLists, metadata);

            setStatus('Analizando eventos (Página 2)...');
            const page2Lines = await getPageTextStruct(doc, 2);
            const eventData = parseEvents(page2Lines); // Now returns { events, substitutions }

            setStatus('Calculando estadísticas...');
            const aggregatedStats = aggregateStats(playerMap, eventData);

            setStatus('Guardando en base de datos...');
            setStatus('Guardando en base de datos...');
            await saveStats(matchInfo, aggregatedStats, metadata, publicUrl);

            setStatus('¡Completado!');
            if (onUploadComplete) onUploadComplete();

        } catch (err) {
            console.error(err);
            setError(err.message || 'Error desconocido procesando el acta');
        } finally {
            setLoading(false);
        }
    };

    // --- Helper Logic (Adapted from Script) ---

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
            lines[y].push({ x: item.transform[4], text: text, width: item.width });
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
        let localTeam = "Local";
        let visitorTeam = "Visitante";
        let isLocal = false;
        let scoreLocal = 0;
        let scoreVisitor = 0;
        let ensayosLocal = 0;
        let ensayosVisitor = 0;

        for (const line of lines) {
            const dateMatch = line.fullText.match(/El dia:\s+(\d{2}\/\d{2}\/\d{4})/);
            if (dateMatch) date = dateMatch[1];

            if (line.fullText.includes("Equip local:") && line.fullText.includes("Equip visitant:")) {
                const parts = line.fullText.split("Equip visitant:");
                localTeam = parts[0].replace("Equip local:", "").trim();
                visitorTeam = parts[1] ? parts[1].trim() : "";

                if (localTeam.toUpperCase().includes("HOSPITALET") || localTeam.toUpperCase().includes("L'H")) {
                    isLocal = true;
                }
            }

            if (line.fullText.includes("Resultat del partit:")) {
                const scoreText = line.fullText.split("Resultat del partit:")[1] || "";
                const scoreMatch = scoreText.match(/(\d+)\s*-\s*(\d+)/);
                if (scoreMatch) {
                    scoreLocal = parseInt(scoreMatch[1]);
                    scoreVisitor = parseInt(scoreMatch[2]);
                }
            }

            if (line.fullText.includes("Total de marques:")) {
                const essaisMatch = line.fullText.match(/Total de marques:\s*(\d+)\s*-\s*(\d+)/);
                if (essaisMatch) {
                    ensayosLocal = parseInt(essaisMatch[1]);
                    ensayosVisitor = parseInt(essaisMatch[2]);
                }
            }
        }

        return {
            date,
            localTeam,
            visitorTeam,
            isLocal,
            scoreLocal,
            scoreVisitor,
            ensayosLocal,
            ensayosVisitor,
            rival: isLocal ? visitorTeam : localTeam
        };
    }

    function parseLineups(lines) {
        let inLocal = false;
        let inVisitor = false;
        const localItems = [];
        const visitorItems = [];

        for (const line of lines) {
            const text = line.fullText.toUpperCase();
            if (text.includes("JUGADORS EQUIP LOCAL")) { inLocal = true; inVisitor = false; continue; }
            if (text.includes("JUGADORS EQUIP VISITANT")) { inVisitor = true; inLocal = false; continue; }
            if (text.includes("RESPONSABLES EQUIP LOCAL")) { inLocal = false; continue; }
            if (text.includes("RESPONSABLES EQUIP VISITANT")) { inVisitor = false; continue; }

            if (inLocal) localItems.push(line);
            if (inVisitor) visitorItems.push(line);
        }

        const parseBlock = (rowLines) => {
            const players = [];
            for (const row of rowLines) {
                const m = row.fullText.match(/^(\d+)\s+(.+)\b(\d{7,10}[A-Z]?)\b/i);
                if (m) {
                    players.push({
                        dorsal: parseInt(m[1]),
                        name: m[2].trim(),
                        licencia: m[3].trim()
                    });
                }
            }
            return players;
        };

        return {
            LOCAL: parseBlock(localItems),
            VISITOR: parseBlock(visitorItems)
        };
    }

    async function findMatch(metadata) {
        const [d, m, y] = metadata.date.split('/');
        const formattedDate = `${y}-${m}-${d}`;

        try {
            const eventData = await apiGet(`/eventos?fecha=${formattedDate}`);

            if (eventData && eventData.length > 0) {
                const matchesData = await apiGet('/partidos').catch(() => []);
                const rivalsData = await apiGet('/rivales').catch(() => []);

                const matchFound = eventData.find(e => {
                    const p = matchesData.find(m => m.Evento == e.id);
                    if (!p) return false;

                    const rival = rivalsData.find(r => r.id_equipo == p.Rival || r.id == p.Rival);
                    const rivalName = rival?.nombre_equipo || p.Rival || '';

                    const rName = rivalName.toLowerCase();
                    const pdfName = metadata.rival.toLowerCase();
                    return (rName.includes(pdfName) || pdfName.includes(rName));
                });

                if (matchFound) {
                    const realMatch = matchesData.find(m => m.Evento == matchFound.id);
                    console.log("Match found in calendar:", realMatch.id);
                    return { id: realMatch.id, type: 'standard' };
                }
            }
        } catch (err) {
            console.error("Error searching match:", err);
        }

        try {
            const existingExternals = await apiGet(`/partidos_externos?fecha=${formattedDate}&equipo_local=${metadata.localTeam}&equipo_visitante=${metadata.visitorTeam}`);

            if (existingExternals && existingExternals.length > 0) {
                const match = existingExternals[0];
                console.log("Existing External Match found:", match.id);
                return { id: match.id, type: 'external' };
            }
        } catch (err) {
            console.error("Error searching external match:", err);
        }

        console.log("Match not found in calendar. Creating External Match...");
        const newMatch = await apiPost('/partidos_externos', {
            fecha: formattedDate,
            equipo_local: metadata.localTeam,
            equipo_visitante: metadata.visitorTeam,
            marcador_local: metadata.scoreLocal || 0,
            marcador_visitante: metadata.scoreVisitor || 0,
            ensayos_local: metadata.ensayosLocal || 0,
            ensayos_visitante: metadata.ensayosVisitor || 0,
            competicion: 'Liga (Acta Externa)'
        });
        return { id: newMatch.id, type: 'external' };
    }

    async function resolvePlayers(playerLists, metadata) {
        const dbPlayers = await apiGet('/jugadores_propios').catch(() => []);
        const externalPlayersAll = await apiGet('/jugadores_externos').catch(() => []);

        const playerMap = { LOCAL: {}, VISITOR: {} };

        const isHomeTeam = (name) => {
            const n = name.toUpperCase();
            return n.includes("HOSPITALET") || n.includes("L'H");
        };

        const processTeam = async (list, teamKey, teamName) => {
            const isHomeSub = (teamKey === 'LOCAL' && isHomeTeam(metadata.localTeam)) || (teamKey === 'VISITOR' && isHomeTeam(metadata.visitorTeam));

            for (let i = 0; i < list.length; i++) {
                const p = list[i];
                let matched = null;

                if (isHomeSub) {
                    matched = dbPlayers.find(db => (db.licencia && db.licencia === p.licencia) ||
                        (db.nombre?.toLowerCase().includes(p.name.split(' ')[0].toLowerCase()) &&
                            db.apellidos?.toLowerCase().includes(p.name.split(' ').slice(-1)[0].toLowerCase())));
                } else {
                    matched = externalPlayersAll.find(ex => ex.licencia === p.licencia);
                }

                if (!matched && !isHomeSub) {
                    try {
                        matched = await apiPost('/jugadores_externos', {
                            nombre_completo: p.name,
                            licencia: p.licencia,
                            ultimo_equipo: teamName
                        });
                    } catch (e) {
                        console.error("Error inserting external player:", e);
                    }
                }

                playerMap[teamKey][p.dorsal] = {
                    ...p,
                    id: matched?.id || null,
                    isExternal: !isHomeSub || !matched,
                    teamName: teamName,
                    isTitular: i < 15,
                    isCaptain: false,
                    stats: { ensayos: 0, transformaciones: 0, penales: 0, drops: 0, tarjetas_amarillas: 0, tarjetas_rojas: 0, minutos: (i < 15 ? 80 : 0) }
                };
            }
        };

        await processTeam(playerLists.LOCAL, 'LOCAL', metadata.localTeam);
        await processTeam(playerLists.VISITOR, 'VISITOR', metadata.visitorTeam);

        return playerMap;
    }

    function parseEvents(lines) {
        const events = [];
        const substitutions = [];
        let currentTeam = 'LOCAL';
        let inScore = false;
        let inCards = false;
        let inChanges = false;

        for (const line of lines) {
            const text = line.fullText.toUpperCase();
            if (text.includes("DETALL DE L'EVOLUCIÓ DEL MARCADOR")) { inScore = true; inCards = false; inChanges = false; continue; }
            if (text.includes("DETALL DE LES EXPULSIONS")) { inScore = false; inCards = true; inChanges = false; continue; }
            if (text.includes("DETALL DE LES SUBSTITUCIONS")) { inScore = false; inCards = false; inChanges = true; continue; }

            if (text.includes("EQUIP LOCAL")) { currentTeam = 'LOCAL'; continue; }
            if (text.includes("EQUIP VISITANT")) { currentTeam = 'VISITOR'; continue; }

            if (inScore) {
                const m = line.fullText.match(/^(E|T|P|D|EP)\s+(\d+)\s+(\d+)/i);
                if (m) {
                    events.push({
                        team: currentTeam,
                        type: m[1].toUpperCase(),
                        dorsal: parseInt(m[2]),
                        minute: parseInt(m[3])
                    });
                }
            }

            if (inCards) {
                const m = line.fullText.match(/^(TA|TR|A|G|R)\s+(\d+)\s+(\d+)/i);
                if (m) {
                    let type = m[1].toUpperCase();
                    if (type === 'A' || type === 'G') type = 'TA';
                    if (type === 'R') type = 'TR';
                    events.push({
                        team: currentTeam,
                        type: type,
                        dorsal: parseInt(m[2]),
                        minute: parseInt(m[3])
                    });
                }
            }

            if (inChanges) {
                const m = line.fullText.match(/(\d+)\s+(\d+)\s+(\d+)/);
                if (m) {
                    substitutions.push({
                        team: currentTeam,
                        dorsalIn: parseInt(m[1]),
                        dorsalOut: parseInt(m[2]),
                        minute: parseInt(m[3])
                    });
                }
            }
        }
        return { events, substitutions };
    }

    function aggregateStats(playerMap, eventData) {
        const { events, substitutions } = eventData;

        events.forEach(ev => {
            const team = playerMap[ev.team];
            if (team && team[ev.dorsal]) {
                const p = team[ev.dorsal];
                if (ev.type === 'E') p.stats.ensayos++;
                if (ev.type === 'T') p.stats.transformaciones++;
                if (ev.type === 'P') p.stats.penales++;
                if (ev.type === 'D') p.stats.drops++;
                if (ev.type === 'TA') p.stats.tarjetas_amarillas++;
                if (ev.type === 'TR') p.stats.tarjetas_rojas++;
            }
        });

        substitutions.forEach(sub => {
            const team = playerMap[sub.team];
            if (team) {
                if (team[sub.dorsalIn]) team[sub.dorsalIn].stats.minutos = (80 - sub.minute);
                if (team[sub.dorsalOut]) team[sub.dorsalOut].stats.minutos = sub.minute;
            }
        });

        return playerMap;
    }

    async function saveStats(matchInfo, playerStatsMap, metadata, publicUrl) {
        const { id, type } = matchInfo;
        const pdfLocalIsHome = (metadata.localTeam.toUpperCase().includes("HOSPITALET") || metadata.localTeam.toUpperCase().includes("L'H"));
        const isExternal = (type === 'external');

        // 0. Update Match Score/Result
        try {
            const scoreUpdate = {
                marcador_local: metadata.scoreLocal,
                marcador_visitante: metadata.scoreVisitor,
                ensayos_local: metadata.ensayosLocal,
                ensayos_visitante: metadata.ensayosVisitor,
                acta_url: publicUrl
            };

            if (type === 'standard') {
                await apiPut(`/partidos/${id}`, scoreUpdate);
            } else {
                await apiPut(`/partidos_externos/${id}`, scoreUpdate);
            }
            console.log("Match scores updated successfully.");
        } catch (err) {
            console.warn("Failed to update match scores:", err);
        }

        const records = [];
        const flatten = (teamMap, teamKey) => {
            if (!teamMap) return;
            const isHome = (teamKey === 'LOCAL' && pdfLocalIsHome) || (teamKey === 'VISITOR' && !pdfLocalIsHome);

            Object.values(teamMap)
                .filter(p => p && p.stats)
                .forEach(p => {
                    const record = {
                        jugador: (isHome && !p.isExternal) ? p.id : null,
                        jugador_externo: p.isExternal ? p.id : null,
                        equipo: p.teamName,
                        dorsal: p.dorsal,
                        licencia: p.licencia,
                        nombre: p.name,
                        es_titular: p.isTitular,
                        es_capitan: p.isCaptain,
                        minutos_jugados: p.stats.minutos,
                        ensayos: p.stats.ensayos,
                        transformaciones: p.stats.transformaciones,
                        penales: p.stats.penales,
                        drops: p.stats.drops,
                        tarjetas_amarillas: p.stats.tarjetas_amarillas,
                        tarjetas_rojas: p.stats.tarjetas_rojas,
                        fue_convocado: true
                    };

                    if (isExternal) record.partido_externo = id;
                    else record.partido = id;
                    records.push(record);
                });
        };

        flatten(playerStatsMap.LOCAL, 'LOCAL');
        flatten(playerStatsMap.VISITOR, 'VISITOR');

        console.log(`Saving ${records.length} player stats records...`);
        for (const record of records) {
            await apiPost('/estadisticas_jugador', record).catch(e => {
                console.error("Error saving player stat:", record.nombre, e);
                throw e;
            });
        }

        // Final update to mark as processed if standard
        if (type === 'standard') {
            await apiPost('/estadisticas_partido', {
                partido_id: id,
                acta_procesada: true,
                fecha_procesado: new Date().toISOString()
            }).catch(() => { });
        }
    }

    return (
        <div style={{ padding: '1.5rem', border: '2px dashed #ccc', borderRadius: '10px', textAlign: 'center', backgroundColor: '#fafafa', marginBottom: '2rem' }}>
            <h3 style={{ color: 'var(--color-primary-blue)', marginTop: 0 }}>Subir Acta del Partido (PDF)</h3>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>Sube el acta oficial para extraer estadísticas automáticamente.</p>

            {!loading && !status && (
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ marginTop: '1rem' }}
                />
            )}

            {loading && (
                <div style={{ marginTop: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--color-primary-orange)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                    <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>{status}</p>
                </div>
            )}

            {!loading && status === '¡Completado!' && (
                <div style={{ marginTop: '1rem', color: 'green', fontWeight: 'bold' }}>
                    ✅ ¡Estadísticas guardadas correctamente!
                </div>
            )}

            {error && (
                <div style={{ marginTop: '1rem', color: 'red', fontWeight: 'bold', backgroundColor: '#fee', padding: '0.5rem', borderRadius: '5px' }}>
                    ❌ Error: {error}
                </div>
            )}
        </div>
    );
};

export default ActaUploader;
