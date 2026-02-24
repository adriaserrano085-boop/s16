
import { supabase } from '../lib/supabaseClient';

const HOSPITALET_NAME = "RC HOSPITALET";
const HOSPITALET_SHIELD = "https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png";

export const leagueService = {
    getStandings: async () => {
        try {
            // 0. Fetch Team Shields (Rivales)
            const { data: rivalsData } = await supabase
                .from('rivales')
                .select('nombre_equipo, escudo');

            const teamShields = {};
            teamShields[HOSPITALET_NAME] = HOSPITALET_SHIELD;

            // 1. Fetch Centralized Match Stats
            const { data: statsData, error: sError } = await supabase
                .from('estadisticas_partido')
                .select(`
                    id, 
                    marcador_local, 
                    marcador_visitante, 
                    ensayos_local,
                    ensayos_visitante,
                    partidos ( id, Rival, es_local, rivales(nombre_equipo) ),
                    partidos_externos ( id, equipo_local, equipo_visitante )
                `);

            if (sError) throw sError;

            const standingsMap = {};

            const initTeam = (name) => ({
                team: name,
                jugados: 0,
                ganados: 0,
                empatados: 0,
                perdidos: 0,
                favor: 0,
                contra: 0,
                dif: 0,
                ensayos: 0,
                bo: 0,
                bd: 0,
                puntos: 0,
                ranking: 0,
                victorias: 0,
                amarillas: 0,
                rojas: 0,
                escudo: teamShields[name] || null
            });

            const updateStats = (teamName, pointsFor, pointsAgainst, triesFor = 0, triesAgainst = 0) => {
                if (!standingsMap[teamName]) standingsMap[teamName] = initTeam(teamName);
                const t = standingsMap[teamName];

                t.jugados += 1;
                t.favor += pointsFor;
                t.contra += pointsAgainst;
                t.dif += (pointsFor - pointsAgainst);
                t.ensayos += triesFor;

                if (pointsFor > pointsAgainst) {
                    t.ganados += 1;
                    t.puntos += 4;
                    if ((pointsFor > pointsAgainst) && (triesFor >= 4)) {
                        t.puntos += 1;
                        t.bo += 1;
                    }
                } else if (pointsFor === pointsAgainst) {
                    t.empatados += 1;
                    t.puntos += 2;
                } else {
                    t.perdidos += 1;
                    if ((pointsAgainst - pointsFor) <= 7) {
                        t.puntos += 1;
                        t.bd += 1;
                    }
                }
            };

            // Initialize teams from rivals Data FIRST to ensure all 7 are present
            if (rivalsData) {
                rivalsData.forEach(r => {
                    const name = r.nombre_equipo;
                    if (!standingsMap[name]) standingsMap[name] = initTeam(name);
                    if (r.escudo) teamShields[name] = r.escudo;
                    // Re-assign shield if it was missing initially
                    if (standingsMap[name]) standingsMap[name].escudo = r.escudo;
                });
            }
            if (!standingsMap[HOSPITALET_NAME]) standingsMap[HOSPITALET_NAME] = initTeam(HOSPITALET_NAME);

            if (statsData) {
                statsData.forEach(stat => {
                    let homeName = "Desconocido Local";
                    let awayName = "Desconocido Visitante";

                    if (stat.partidos) {
                        const p = stat.partidos;
                        const rival = p.rivales?.nombre_equipo || p.Rival || "Rival";
                        if (p.es_local) {
                            homeName = HOSPITALET_NAME;
                            awayName = rival;
                        } else {
                            homeName = rival;
                            awayName = HOSPITALET_NAME;
                        }
                    } else if (stat.partidos_externos) {
                        const pe = stat.partidos_externos;
                        homeName = pe.equipo_local;
                        awayName = pe.equipo_visitante;
                    }

                    updateStats(homeName, stat.marcador_local || 0, stat.marcador_visitante || 0, stat.ensayos_local || 0, stat.ensayos_visitante || 0);
                    updateStats(awayName, stat.marcador_visitante || 0, stat.marcador_local || 0, stat.ensayos_visitante || 0, stat.ensayos_local || 0);
                });
            }

            // 2. Fetch Player Stats for Card Aggregation
            const { data: playerStats, error: pError } = await supabase
                .from('estadisticas_jugador')
                .select('equipo, tarjetas_amarillas, tarjetas_rojas');

            if (pError) console.error("Error fetching player stats for cards:", pError);

            if (playerStats) {
                playerStats.forEach(stat => {
                    let team = stat.equipo;
                    // Normalize Hospitalet Name
                    if (team && (team.toUpperCase() === "RC L'HOSPITALET" || team.toUpperCase().includes("L'H"))) {
                        team = HOSPITALET_NAME;
                    }

                    if (team && standingsMap[team]) {
                        standingsMap[team].amarillas = (standingsMap[team].amarillas || 0) + (stat.tarjetas_amarillas || 0);
                        standingsMap[team].rojas = (standingsMap[team].rojas || 0) + (stat.tarjetas_rojas || 0);
                    }
                });
            }

            let standings = Object.values(standingsMap);
            standings.sort((a, b) => {
                if (b.puntos !== a.puntos) return b.puntos - a.puntos;
                return b.dif - a.dif;
            });

            return standings.map((t, index) => ({
                ...t,
                ranking: index + 1,
                victorias: t.jugados > 0 ? Math.round((t.ganados / t.jugados) * 100) : 0
            }));
        } catch (error) {
            console.error('Error in leagueService.getStandings:', error);
            throw error;
        }
    }
};
