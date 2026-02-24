
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Target Match: RC L'Hospitalet vs CR Sant Cugat (2026-02-21)
// We need to find the event ID for this match.
const MATCH_DATE = '2026-02-21';
const RIVAL_NAME = 'Sant Cugat';

const jsonAnalysis = {
    "match_report": {
        "metadata": {
            "date": "2026-02-21",
            "time": "16:00",
            "competition": "FEDERACIÓ CATALANA DE RUGBI (S16 1a Catalana - Jornada 12)",
            "location": "Feixa Llarga (Barcelona)",
            "referee": "Muntané Roca, Ton",
            "teams": {
                "local": "RC L'Hospitalet",
                "visitor": "CR Sant Cugat"
            },
            "final_score": {
                "local": 31,
                "visitor": 54
            }
        },
        "executive_summary": [
            "Partido decidido por la clara superioridad del CR Sant Cugat en la segunda parte, mostrando una mayor eficacia y capacidad de anotación sostenida.",
            "El RC L'Hospitalet fue altamente competitivo durante el primer tiempo, pero evidenció una clara caída de rendimiento físico y táctico tras el descanso.",
            "El manejo de las superioridades numéricas (tarjetas amarillas) y la aportación ofensiva desde el banquillo fueron los grandes diferenciadores a favor del equipo visitante."
        ],
        "match_flow": [
            {
                "time_range": "06-18",
                "description": "Dominio inicial visitante (Sant Cugat se pone 5-14)."
            },
            {
                "time_range": "27-31",
                "description": "Reacción fulgurante local. L'Hospitalet anota dos ensayos y una transformación (se pone 19-14)."
            },
            {
                "time_range": "30-39",
                "description": "Tramo clave. Intercambio de golpes brutal. 14 puntos para L'Hospitalet y 14 puntos para Sant Cugat en 10 minutos."
            },
            {
                "time_range": "40-70",
                "description": "La capacidad de Sant Cugat para anotar se incrementa de forma constante, iniciando un parcial que cerraría el partido con una ventaja amplia."
            }
        ],
        "cards_and_superiority": {
            "rules": "Amarilla = Expulsión temporal de 10 minutos",
            "events": [
                {
                    "minute": 22,
                    "team": "visitor",
                    "dorsal": 8,
                    "reason": "Falta reiterada",
                    "card_type": "Amarilla",
                    "partial_score_during_card": {
                        "local": 14,
                        "visitor": 7
                    },
                    "conclusion": "L'Hospitalet sí aprovechó la primera superioridad numérica, logrando su mejor fase de juego."
                },
                {
                    "minute": 57,
                    "team": "visitor",
                    "dorsal": 20,
                    "reason": "Juego peligroso",
                    "card_type": "Amarilla",
                    "partial_score_during_card": {
                        "local": 0,
                        "visitor": 7
                    },
                    "conclusion": "L'Hospitalet no aprovechó la segunda superioridad y recibió un parcial en contra."
                }
            ],
            "technical_interpretation": "L'Hospitalet supo sacar ventaja de la primera expulsión, pero la inoperancia en la segunda indica un grave desgaste físico en los últimos 20 minutos."
        },
        "substitutes_impact": {
            "local": {
                "impact_summary": "No logró obtener una respuesta anotadora inmediata desde el banquillo que cambiara la dinámica en la segunda parte.",
                "key_notes": "El suplente #22 logró anotar un ensayo en el minuto 69, pero sin impacto en el momento crítico del partido."
            },
            "visitor": {
                "impact_summary": "Demostró una gestión eficaz de los tiempos de sustitución.",
                "key_player": {
                    "dorsal": 18,
                    "name": "Marsinyac Garcia",
                    "entry_minute": 28,
                    "scoring_minute": 39,
                    "time_to_impact_minutes": 11,
                    "notes": "Su entrada ayudó a frenar la sangría local y mantuvo la continuidad del juego visitante antes del descanso."
                }
            }
        },
        "rosters_and_stats": {
            "local": [
                { "dorsal": 1, "name": "Torres Puebla, Eduard", "position": "1ª Línea", "minutes_played": 40, "points": 0, "events": ["Sustituido (min 40)"] },
                { "dorsal": 2, "name": "Villanova Escobar, Bruno", "position": "1ª Línea", "minutes_played": 65, "points": 0, "events": ["Sustituido (min 65)"] },
                { "dorsal": 3, "name": "Epoumbi, Prescott Lacroix", "position": "1ª Línea", "minutes_played": 52, "points": 0, "events": ["Sustituido (min 52)"] },
                { "dorsal": 4, "name": "Villen Hernandez, Iu", "position": "2ª Línea", "minutes_played": 70, "points": 0, "events": [] },
                { "dorsal": 5, "name": "De Toledo Castro, Fabio", "position": "2ª Línea", "minutes_played": 70, "points": 0, "events": [] },
                { "dorsal": 6, "name": "Bodokia Tsartsidze, Daniel", "position": "3ª Línea", "minutes_played": 70, "points": 0, "events": [] },
                { "dorsal": 7, "name": "Ferré Garcia, Xavier", "position": "3ª Línea", "minutes_played": 70, "points": 0, "events": [] },
                { "dorsal": 8, "name": "Caro Caballero, Victor", "position": "Nº 8", "minutes_played": 70, "points": 0, "events": [] },
                { "dorsal": 9, "name": "Covelo Gonzalez, Nicolas", "position": "Medio Melé", "minutes_played": 30, "points": 0, "events": ["Sustituido (min 30)"] },
                { "dorsal": 10, "name": "Garreta Abad, Jon", "position": "Apertura", "minutes_played": 70, "points": 0, "events": [] },
                { "dorsal": 11, "name": "Jiménez González, Lucas", "position": "Ala (C)", "minutes_played": 70, "points": 0, "events": [] },
                { "dorsal": 12, "name": "Buges Sanchez, Erik", "position": "Centro", "minutes_played": 70, "points": 2, "points_breakdown": "1 Transf", "events": [] },
                { "dorsal": 13, "name": "Díaz Pauta, Pau", "position": "Centro", "minutes_played": 70, "points": 9, "points_breakdown": "1 Ensayo, 2 Transf", "events": [] },
                { "dorsal": 14, "name": "Vallespin Viera, Oriol", "position": "Ala", "minutes_played": 70, "points": 10, "points_breakdown": "2 Ensayos", "events": [] },
                { "dorsal": 15, "name": "Navarro Minguez, Alex", "position": "Zaguero", "minutes_played": 70, "points": 5, "points_breakdown": "1 Ensayo", "events": [] },
                { "dorsal": 16, "name": "Gutierrez Gordillo, Adrian", "position": "Suplente", "minutes_played": 30, "points": 0, "events": ["Entra min 40"] },
                { "dorsal": 17, "name": "Guil Perez, Bruno", "position": "Suplente", "minutes_played": 18, "points": 0, "events": ["Entra min 52"] },
                { "dorsal": 18, "name": "Rodríguez Torres, Alba", "position": "Suplente", "minutes_played": 5, "points": 0, "events": ["Entra min 65"] },
                { "dorsal": 22, "name": "Lozano Nieto, Julen", "position": "Suplente", "minutes_played": null, "points": 5, "points_breakdown": "1 Ensayo", "events": ["Anota ensayo min 69"] },
                { "dorsal": 23, "name": "Navarro Minguez, Hugo", "position": "Suplente", "minutes_played": 40, "points": 0, "events": ["Entra min 30"] }
            ],
            "visitor": [
                { "dorsal": 1, "name": "Iguña Marin, Ismael", "position": "1ª Línea", "minutes_played": 70, "points": 10, "points_breakdown": "2 Ensayos", "events": [] },
                { "dorsal": 2, "name": "Iguña Marin, Eidan", "position": "1ª Línea", "minutes_played": 70, "points": 0, "events": [] },
                { "dorsal": 3, "name": "Quiroz Alen, Lautaro", "position": "1ª Línea", "minutes_played": 70, "points": 5, "points_breakdown": "1 Ensayo", "events": [] },
                { "dorsal": 4, "name": "Dura Marquez, Aran", "position": "2ª Línea", "minutes_played": 59, "points": 0, "events": ["Sustituido (min 59)"] },
                { "dorsal": 5, "name": "Jurado Arenas, Derek", "position": "2ª Línea", "minutes_played": 53, "points": 0, "events": ["Sustituido (min 53)"] },
                { "dorsal": 6, "name": "Viudez Caparros, Rocio", "position": "3ª Línea", "minutes_played": 53, "points": 0, "events": ["Sustituido (min 53)"] },
                { "dorsal": 7, "name": "Argemí Domingo, Iu", "position": "3ª Línea", "minutes_played": 70, "points": 0, "events": [] },
                { "dorsal": 8, "name": "Barnola Mancebo, Cèdric", "position": "Nº 8 (C)", "minutes_played": 70, "points": 0, "events": ["Tarjeta Amarilla (min 22)"] },
                { "dorsal": 9, "name": "Rotondo Mora, Tadeo", "position": "Medio Melé", "minutes_played": 70, "points": 5, "points_breakdown": "1 Ensayo", "events": [] },
                { "dorsal": 10, "name": "Lopez Ramírez, Hugo", "position": "Apertura", "minutes_played": 70, "points": 14, "points_breakdown": "7 Transf", "events": [] },
                { "dorsal": 11, "name": "Castilla Batile, Eduardo", "position": "Ala", "minutes_played": 28, "points": 0, "events": ["Sustituido (min 28)"] },
                { "dorsal": 12, "name": "Montoya Latouche, Damian", "position": "Centro", "minutes_played": 70, "points": 10, "points_breakdown": "2 Ensayos", "events": [] },
                { "dorsal": 13, "name": "Gimenez Unzueta, Loïk", "position": "Centro", "minutes_played": 70, "points": 5, "points_breakdown": "1 Ensayo", "events": [] },
                { "dorsal": 14, "name": "Fabregas Roig, Marçal", "position": "Ala", "minutes_played": 59, "points": 0, "events": ["Sustituido (min 59)"] },
                { "dorsal": 15, "name": "Gallo Rhodius, Felipe", "position": "Zaguero", "minutes_played": 70, "points": 0, "events": [] },
                { "dorsal": 16, "name": "Jimenez Guerrero, Danel", "position": "Suplente", "minutes_played": 11, "points": 0, "events": ["Entra min 59"] },
                { "dorsal": 17, "name": "Bulla, Bautista", "position": "Suplente", "minutes_played": 17, "points": 0, "events": ["Entra min 53"] },
                { "dorsal": 18, "name": "Marsinyac Garcia, Kim", "position": "Suplente", "minutes_played": 42, "points": 5, "points_breakdown": "1 Ensayo", "events": ["Entra min 28", "Anota ensayo min 39"] },
                { "dorsal": 20, "name": "Pinilla Castellanos, Aitor", "position": "Suplente", "minutes_played": 17, "points": 0, "events": ["Entra min 53", "Tarjeta Amarilla (min 57)"] },
                { "dorsal": 21, "name": "Duran Foix, Isidoro", "position": "Suplente", "minutes_played": 11, "points": 0, "events": ["Entra min 59"] }
            ]
        },
        "recommendations_for_staff": [
            "Revisar el momento y perfil de las sustituciones en RC L'Hospitalet, buscando impacto ofensivo inmediato en los últimos 20-25 minutos.",
            "Diseñar y entrenar jugadas específicas para aprovechar la ventaja numérica; es prioritario reforzar la paciencia en ataque en esos escenarios.",
            "Revisar exhaustivamente en vídeo el tramo del minuto 40 al 70 para identificar las causas de la caída local (placajes iniciales, fases estáticas, recolocación defensiva)."
        ]
    }
};

async function injectAnalysis() {
    try {
        console.log(`Searching for match on ${MATCH_DATE} against ${RIVAL_NAME}...`);

        // 1. Find the match
        const { data: events, error: eError } = await supabase
            .from('eventos')
            .select('id, fecha, partidos(id, Rival)')
            .gte('fecha', `${MATCH_DATE} 00:00:00`)
            .lte('fecha', `${MATCH_DATE} 23:59:59`);

        if (eError) throw eError;

        const event = events.find(e => {
            const p = Array.isArray(e.partidos) ? e.partidos[0] : e.partidos;
            return p && p.Rival && p.Rival.includes(RIVAL_NAME);
        });

        if (!event) {
            console.error("Match not found!");
            return;
        }

        const eventId = event.id;
        console.log(`Found event ID: ${eventId}`);

        // 2. Upsert into analisis_partido
        const payload = {
            evento_id: eventId,
            raw_json: jsonAnalysis,
            updated_at: new Date().toISOString()
        };

        const { data: existing } = await supabase
            .from('analisis_partido')
            .select('id')
            .eq('evento_id', eventId)
            .maybeSingle();

        if (existing) {
            console.log(`Updating existing analysis ID: ${existing.id}`);
            const { error: uError } = await supabase
                .from('analisis_partido')
                .update(payload)
                .eq('id', existing.id);
            if (uError) throw uError;
        } else {
            console.log("Inserting new analysis record...");
            const { error: iError } = await supabase
                .from('analisis_partido')
                .insert(payload);
            if (iError) throw iError;
        }

        console.log("Analysis injected successfully!");
    } catch (err) {
        console.error("Error:", err);
    }
}

injectAnalysis();
