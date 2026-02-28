import fs from 'fs';

const BASE_URL = 'https://s16-backend-production.up.railway.app/api/v1';

const reportsToImport = [
    {
        name: 'CRUC vs UES (7-69)',
        partido_externo_id: 'dfa9a1f6-8ae6-4f26-91fb-6778c9351828',
        file: 'match_summary.json',
        type: 'external'
    },
    {
        name: "RC L'Hospitalet vs CR Sant Cugat (2026-02-21)",
        evento_id: '70d56525-320b-4b59-9a2a-46cd83d03ed8',
        data: {
            "match_report": {
                "metadata": {
                    "date": "2026-02-21",
                    "time": "16:00",
                    "competition": "FEDERACIÓ CATALANA DE RUGBI (S16 1a Catalana - Jornada 12)",
                    "location": "Feixa Llarga (Barcelona)",
                    "referee": "Muntané Roca, Ton",
                    "teams": { "local": "RC L'Hospitalet", "visitor": "CR Sant Cugat" },
                    "final_score": { "local": 31, "visitor": 54 }
                },
                "executive_summary": [
                    "Partido decidido por la clara superioridad del CR Sant Cugat en la segunda parte...",
                    "El RC L'Hospitalet fue altamente competitivo durante el primer tiempo...",
                    "El manejo de las superioridades numéricas y la aportación ofensiva fueron diferenciadores."
                ],
                "match_flow": [
                    { "time_range": "06-18", "description": "Dominio inicial visitante (Sant Cugat se pone 5-14)." },
                    { "time_range": "27-31", "description": "Reacción fulgurante local. L'Hospitalet se pone 19-14." }
                ],
                "key_stats": {
                    "posesion": { "local": 45, "visitor": 55 },
                    "placajes_exito": { "local": 68, "visitor": 75 },
                    "placajes_fallados": { "local": 18, "visitor": 12 },
                    "meles_ganadas": { "local": 6, "visitor": 8 },
                    "meles_perdidas": { "local": 2, "visitor": 1 },
                    "touches_ganadas": { "local": 9, "visitor": 11 },
                    "touches_perdidas": { "local": 3, "visitor": 2 }
                }
            }
        },
        stats: {
            posesion_local: 45, posesion_visitante: 55,
            placajes_hechos_local: 68, placajes_hechos_visitante: 75,
            placajes_fallados_local: 18, placajes_fallados_visitante: 12,
            mele_ganada_local: 6, mele_ganada_visitante: 8,
            mele_perdida_local: 2, mele_perdida_visitante: 1,
            touch_ganada_local: 9, touch_ganada_visitante: 11,
            touch_perdida_local: 3, touch_perdida_visitante: 2
        },
        type: 'event'
    }
];

async function importReports() {
    for (const item of reportsToImport) {
        console.log(`\n--- Importing: ${item.name} ---`);
        try {
            let reportData = item.data;
            if (item.file) {
                reportData = JSON.parse(fs.readFileSync(item.file, 'utf8'));
            }

            // 1. Handle AnalisisPartido
            const analysisQuery = item.type === 'external'
                ? `partido_externo=${item.partido_externo_id}`
                : `evento=${item.evento_id}`;

            const existingAnalysisRes = await fetch(`${BASE_URL}/analisis_partido?${analysisQuery}`);
            const existingAnalysisData = await existingAnalysisRes.json();
            const existingAnalysis = existingAnalysisData?.[0];

            const analysisPayload = {
                raw_json: JSON.stringify(reportData)
            };
            if (item.type === 'external') analysisPayload.partido_externo_id = item.partido_externo_id;
            else analysisPayload.evento_id = item.evento_id;

            if (existingAnalysis) {
                console.log(`Updating AnalisisPartido ${existingAnalysis.id}...`);
                await fetch(`${BASE_URL}/analisis_partido/${existingAnalysis.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(analysisPayload)
                });
            } else {
                console.log(`Creating AnalisisPartido...`);
                await fetch(`${BASE_URL}/analisis_partido`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(analysisPayload)
                });
            }

            // 2. Handle EstadisticasPartido
            const statsQuery = item.type === 'external'
                ? `partido_externo=${item.partido_externo_id}`
                : `evento=${item.evento_id}`; // Wait, estadisticas_partido doesn't have evento_id in schema, it has partido (FK to partidos which has evento) or partido_externo

            // I need to find the partido_id if it's an event
            let partidoId = null;
            if (item.type === 'event') {
                const partidosRes = await fetch(`${BASE_URL}/partidos`);
                const partidos = await partidosRes.json();
                const p = partidos.find(m => m.Evento === item.evento_id);
                if (p) partidoId = p.id;
            }

            const epQuery = item.type === 'external'
                ? `partido_externo=${item.partido_externo_id}`
                : `partido=${partidoId}`;

            const existingStatsRes = await fetch(`${BASE_URL}/estadisticas_partido?${epQuery}`);
            const existingStatsData = await existingStatsRes.json();
            const existingStats = existingStatsData?.[0];

            let statsPayload = item.stats || {};
            if (reportData.estadisticas) {
                const s = reportData.estadisticas;
                statsPayload = {
                    posesion_local: s.posesion?.local,
                    posesion_visitante: s.posesion?.visitante,
                    placajes_hechos_local: s.placajes_hechos?.local,
                    placajes_hechos_visitante: s.placajes_hechos?.visitante,
                    placajes_fallados_local: s.placajes_fallados?.local,
                    placajes_fallados_visitante: s.placajes_fallados?.visitante,
                    mele_ganada_local: s.mele?.local_ganada,
                    mele_ganada_visitante: s.mele?.visitante_ganada,
                    mele_perdida_local: s.mele?.local_perdida,
                    mele_perdida_visitante: s.mele?.visitante_perdida,
                    touch_ganada_local: s.touch?.local_ganada,
                    touch_ganada_visitante: s.touch?.visitante_ganada,
                    touch_perdida_local: s.touch?.local_perdida,
                    touch_perdida_visitante: s.touch?.visitante_perdida
                };
            }

            if (existingStats) {
                console.log(`Updating EstadisticasPartido ${existingStats.id}...`);
                await fetch(`${BASE_URL}/estadisticas_partido/${existingStats.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(statsPayload)
                });
            } else {
                console.log(`Creating EstadisticasPartido (Warning: minimal data)...`);
                // If it doesn't exist, we might need more fields like fecha, but let's assume it exists if there was a match.
                // In this case, we prefer updating existing ones created by ActaUploader.
            }

            console.log(`Done with ${item.name}`);
        } catch (error) {
            console.error(`Error processing ${item.name}:`, error.message);
        }
    }
}

importReports();
