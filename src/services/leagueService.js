import { apiGet } from '../lib/apiClient';

const HOSPITALET_NAME = "RC HOSPITALET";
const HOSPITALET_SHIELD = "https://tyqyixwqoxrrfvoeotax.supabase.co/storage/v1/object/public/imagenes/Escudo_Hospi_3D-removebg-preview.png";

export const leagueService = {
    getStandings: async () => {
        try {
            // 0. Fetch necessary data in parallel
            const [rivalsData, statsData, matchesData, matchesExternosData, playerStats] = await Promise.all([
                apiGet('/rivales').catch(() => []),
                apiGet('/estadisticas_partido').catch(() => []),
                apiGet('/partidos').catch(() => []),
                apiGet('/partidos_externos').catch(() => []),
                apiGet('/estadisticas_jugador').catch(() => [])
            ]);

            // Defensive check: ensure all data are arrays
            const rivals = Array.isArray(rivalsData) ? rivalsData : [];
            const stats = Array.isArray(statsData) ? statsData : [];
            const matches = Array.isArray(matchesData) ? matchesData : [];
            const matchesExternos = Array.isArray(matchesExternosData) ? matchesExternosData : [];
            const pStats = Array.isArray(playerStats) ? playerStats : [];

            const teamShields = {};
            teamShields[HOSPITALET_NAME] = HOSPITALET_SHIELD;

            // Map data for lookup
            const rivalsMap = {};
            rivals.forEach(r => {
                rivalsMap[r.id_equipo] = r;
                teamShields[r.nombre_equipo] = r.escudo;
            });

            const matchesMap = {};
            matches.forEach(m => {
                matchesMap[m.id] = m;
            });

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

                if ((triesFor - triesAgainst) >= 3) {
                    t.puntos += 1;
                    t.bo += 1;
                }
            };

            // Initialize teams from rivals Data
            rivals.forEach(r => {
                const name = r.nombre_equipo;
                if (!standingsMap[name]) standingsMap[name] = initTeam(name);
            });
            if (!standingsMap[HOSPITALET_NAME]) standingsMap[HOSPITALET_NAME] = initTeam(HOSPITALET_NAME);

            // Process match statistics
            if (stats && stats.length > 0) {
                stats.forEach(stat => {
                    if (stat.marcador_local === null || stat.marcador_visitante === null) return;

                    let homeName = "Desconocido Local";
                    let awayName = "Desconocido Visitante";

                    // Handle manual joins
                    if (stat.partido) {
                        const p = matchesMap[stat.partido];
                        if (p) {
                            const rival = rivalsMap[p.Rival]?.nombre_equipo || p.Rival || "Rival";
                            if (p.es_local) {
                                homeName = HOSPITALET_NAME;
                                awayName = rival;
                            } else {
                                homeName = rival;
                                awayName = HOSPITALET_NAME;
                            }
                        }
                    } else if (stat.partido_externo) {
                        const pe = matchesExternos.find(m => m.id === stat.partido_externo);
                        if (pe) {
                            homeName = pe.equipo_local;
                            awayName = pe.equipo_visitante;
                        }
                    }

                    updateStats(homeName, stat.marcador_local, stat.marcador_visitante, stat.ensayos_local || 0, stat.ensayos_visitante || 0);
                    updateStats(awayName, stat.marcador_visitante, stat.marcador_local, stat.ensayos_visitante || 0, stat.ensayos_local || 0);
                });
            }

            // Process disciplinary actions
            if (pStats && pStats.length > 0) {
                pStats.forEach(stat => {
                    let team = stat.equipo;
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
            console.log('leagueService: Standing calculation skipped (data unavailable)');
            return [];
        }
    }
};

export default leagueService;
