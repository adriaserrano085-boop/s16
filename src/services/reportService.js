
export const reportService = {
    /**
     * Converts a structured analysis JSON into a professional Markdown report.
     * @param {Object} data - The analysis data object.
     * @returns {string} - The formatted Markdown report.
     */
    jsonToMarkdown: (data) => {
        try {
            // New Format Detection (Master Schema)
            if (data.match_report) {
                const report = data.match_report;
                const {
                    metadata,
                    executive_summary,
                    match_flow,
                    set_pieces,
                    cards_and_superiority,
                    substitutes_impact,
                    actions_timeline,
                    rosters_and_stats,
                    recommendations_for_staff,
                    key_stats
                } = report;

                let md = "# Informe de Análisis de Partido\n\n";

                // Metadata
                if (metadata) {
                    md += `**Partido**: ${metadata.teams?.local || 'Local'} vs ${metadata.teams?.visitor || 'Visitante'}\n`;
                    md += `**Fecha**: ${metadata.date || '-'}\n`;
                    md += `**Resultado**: ${metadata.score?.local || 0} - ${metadata.score?.visitor || 0}\n\n`;
                }

                // Executive Summary
                if (executive_summary && Array.isArray(executive_summary)) {
                    md += `## 📋 Resumen Ejecutivo\n`;
                    executive_summary.forEach(item => {
                        md += `- ${item}\n`;
                    });
                    md += "\n";
                }

                // Match Flow
                if (match_flow && Array.isArray(match_flow)) {
                    md += `## 📈 Flujo del Partido\n`;
                    match_flow.forEach(period => {
                        md += `**Min ${period.time_range}**: ${period.description}\n`;
                    });
                    md += "\n";
                }

                // Key Stats Table
                if (key_stats) {
                    md += `## 📊 Estadísticas Clave\n`;
                    md += `| Métrica | ${metadata?.teams?.local || 'Local'} | ${metadata?.teams?.visitor || 'Visitante'} |\n`;
                    md += `| :--- | :---: | :---: |\n`;
                    Object.keys(key_stats).forEach(key => {
                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        md += `| ${label} | ${key_stats[key].local ?? 0} | ${key_stats[key].visitor ?? 0} |\n`;
                    });
                    md += "\n";
                }

                // Set Pieces Analysis
                if (set_pieces) {
                    md += `## 🏉 Análisis de Fases Estáticas\n`;
                    if (set_pieces.mele) md += `### Melés\n${set_pieces.mele}\n\n`;
                    if (set_pieces.touch) md += `### Touches / Lineouts\n${set_pieces.touch}\n\n`;
                    if (set_pieces.rucks) md += `### Rucks / Puntos de Encuentro\n${set_pieces.rucks}\n\n`;
                }

                // Disciplina
                if (cards_and_superiority) {
                    md += `## 🛡️ Disciplina y Superioridad\n`;
                    if (cards_and_superiority.technical_interpretation) {
                        md += `> ${cards_and_superiority.technical_interpretation}\n\n`;
                    }
                    if (cards_and_superiority.events && Array.isArray(cards_and_superiority.events)) {
                        cards_and_superiority.events.forEach(event => {
                            md += `**Min ${event.minute}** - Tarjeta ${event.card_type} (#${event.dorsal}): ${event.reason}\n`;
                        });
                        md += "\n";
                    }
                }

                // Impacto del Banquillo
                if (substitutes_impact) {
                    md += `## 🔄 Impacto del Banquillo\n`;
                    ['local', 'visitor'].forEach(team => {
                        const impact = substitutes_impact[team];
                        if (impact) {
                            md += `### ${team === 'local' ? (metadata?.teams?.local || 'Local') : (metadata?.teams?.visitor || 'Visitante')}\n`;
                            md += `- ${impact.impact_summary}\n`;
                            if (impact.key_player) md += `- **Clave**: ${impact.key_player.name} (#${impact.key_player.dorsal}). ${impact.key_player.notes}\n`;
                            md += "\n";
                        }
                    });
                }

                // Actions Timeline
                if (actions_timeline && Array.isArray(actions_timeline)) {
                    md += `## ⏱️ Cronología de Acciones\n`;
                    actions_timeline.forEach(event => {
                        const teamStr = event.team === 'local' ? (metadata?.teams?.local || 'Local') : (metadata?.teams?.visitor || 'Visitante');
                        md += `**Min ${event.minute}** - ${event.event_type} (${teamStr}): ${event.player || 'Equipo'} (#${event.dorsal || '-'})${event.points ? ` (+${event.points} pts)` : ''}\n`;
                    });
                    md += "\n";
                }

                // Recommendations
                if (recommendations_for_staff && Array.isArray(recommendations_for_staff)) {
                    md += `## 💡 Recomendaciones para el Staff\n`;
                    recommendations_for_staff.forEach(rec => {
                        md += `- ${rec}\n`;
                    });
                    md += "\n";
                }

                // Rosters
                if (rosters_and_stats) {
                    md += `## 👥 Rendimiento Individual\n`;
                    ['local', 'visitor'].forEach(teamKey => {
                        const players = rosters_and_stats[teamKey];
                        if (players) {
                            md += `### ${teamKey === 'local' ? (metadata?.teams?.local || 'Local') : (metadata?.teams?.visitor || 'Visitante')}\n`;
                            md += `| # | Jugador | Pos | Min | Pts | Eventos |\n`;
                            md += `|---|---------|-----|-----|-----|---------|\n`;
                            players.forEach(p => {
                                md += `| ${p.dorsal} | ${p.name} | ${p.position} | ${p.minutes_played || 0} | ${p.points || 0} | ${(p.events || []).join(', ')} |\n`;
                            });
                            md += "\n";
                        }
                    });
                }

                return md;
            }

            // Legacy Format
            const {
                analisis_dinamico,
                scouting_fases,
                ensayos,
                disciplina,
                estadisticas,
                conclusion
            } = data;

            let md = "";

            // 0. Resumen del Partido (NEW)
            if (data.resumen) {
                md += `## Resumen del Partido\n${data.resumen}\n\n`;
            }

            // 1. Análisis Dinámico
            if (analisis_dinamico) {
                md += `## 1. Desglose Dinámico del Juego\n${analisis_dinamico}\n\n`;
            }

            // 2. Scouting
            if (scouting_fases) {
                md += `## 2. Scouting Visual: Fases Estáticas\n`;
                if (scouting_fases.mele) md += `- **Melé**: ${scouting_fases.mele}\n`;
                if (scouting_fases.touch) md += `- **Touch**: ${scouting_fases.touch}\n`;
                if (scouting_fases.rucks) md += `- **Rucks**: ${scouting_fases.rucks}\n`;
                md += "\n";
            }

            // 3. Ensayos
            if (ensayos && Array.isArray(ensayos) && ensayos.length > 0) {
                md += `## 3. Análisis de los Ensayos (Video-Breakdown)\n`;
                ensayos.forEach(ensayo => {
                    md += `**Min ${ensayo.minuto} (${ensayo.equipo})**: ${ensayo.descripcion}\n`;
                });
                md += "\n";
            }

            // 4. Disciplina
            if (disciplina) {
                md += `## 4. Factor Indisciplina\n${disciplina}\n\n`;
            }

            // 5. Estadísticas
            if (estadisticas) {
                md += `## 5. Estadísticas Clave (Video-Scouting)\n`;
                md += `| Métrica | Local | Visitante |\n`;
                md += `| :--- | :---: | :---: |\n`;
                if (estadisticas.entradas_22) md += `| Entradas en 22 | ${estadisticas.entradas_22.local} | ${estadisticas.entradas_22.visitante} |\n`;
                if (estadisticas.placajes_fallados) md += `| Placajes Fallados | ${estadisticas.placajes_fallados.local} | ${estadisticas.placajes_fallados.visitante} |\n`;
                if (estadisticas.turnovers) md += `| Turnovers Ganados | ${estadisticas.turnovers.local} | ${estadisticas.turnovers.visitante} |\n`;
                if (estadisticas.penaltis) md += `| Penaltis Cometidos | ${estadisticas.penaltis.local} | ${estadisticas.penaltis.visitante} |\n`;
                md += "\n";
            }

            // Conclusión
            if (conclusion) {
                md += `**Conclusión del Analista**:\n${conclusion}`;
            }

            return md;
        } catch (e) {
            console.error("Error parsing JSON report:", e);
            return "❌ Error al procesar el JSON. Asegúrate de que el formato es correcto.";
        }
    },

    /**
     * Returns a template JSON so the user knows what to paste.
     */
    getTemplate: () => {
        return {
            "match_report": {
                "metadata": {
                    "teams": { "local": "RC L'Hospitalet", "visitor": "Rival" },
                    "date": "2024-XX-XX",
                    "score": { "local": 0, "visitor": 0 }
                },
                "executive_summary": [
                    "Punto clave 1...",
                    "Punto clave 2..."
                ],
                "match_flow": [
                    { "time_range": "0-20", "description": "Dominio territorial..." }
                ],
                "key_stats": {
                    "posesion": { "local": 50, "visitor": 50 },
                    "placajes_exito": { "local": 80, "visitor": 75 },
                    "turnovers_ganados": { "local": 5, "visitor": 3 },
                    "penaltis_cometidos": { "local": 10, "visitor": 12 },
                    "entradas_22": { "local": 4, "visitor": 2 }
                },
                "set_pieces": {
                    "mele": "Análisis detallado de melés...",
                    "touch": "Análisis de lineouts...",
                    "rucks": "Limpieza y velocidad de rucks..."
                },
                "cards_and_superiority": {
                    "technical_interpretation": "Lectura del arbitraje...",
                    "events": [
                        { "minute": 25, "card_type": "Yellow", "dorsal": 7, "team": "local", "reason": "Placaje alto" }
                    ]
                },
                "substitutes_impact": {
                    "local": {
                        "impact_summary": "Mejora en la melé...",
                        "key_player": { "name": "Nombre", "dorsal": 16, "notes": "Gran impacto físico" }
                    },
                    "visitor": {
                        "impact_summary": "Sin cambios notables"
                    }
                },
                "actions_timeline": [
                    { "minute": 10, "event_type": "Try", "player": "Nombre", "dorsal": 14, "team": "local", "points": 5, "description": "Ensayo tras maul" },
                    { "minute": 55, "event_type": "Substitution", "player_in": "Entra Jugador", "dorsal_in": 16, "player_out": "Sale Jugador", "dorsal_out": 1, "team": "local", "description": "Cambio táctico" }
                ],
                "rosters_and_stats": {
                    "local": [
                        { "dorsal": 1, "name": "Jugador", "position": "PR", "minutes_played": 60, "points": 0, "events": ["Tackle", "Carry"] }
                    ],
                    "visitor": []
                },
                "recommendations_for_staff": [
                    "Mejorar salida de 22...",
                    "Ajustar defensa en maul"
                ]
            }
        };
    },

    /**
     * Extracts flat data from the Master Schema for component state syncing.
     */
    syncAnalysisToState: (jsonData) => {
        if (!jsonData || !jsonData.match_report) return null;
        const report = jsonData.match_report;
        const stats = report.key_stats || {};

        return {
            timeline: (report.actions_timeline || []).map(ev => ({
                minuto: ev.minute,
                equipo: ev.team === 'local' ? 'Local' : 'Visitante',
                team_label: ev.team === 'local' ? 'L' : 'V',
                type: ev.event_type,
                player: ev.player,
                dorsal: ev.dorsal,
                player_in: ev.player_in,
                player_out: ev.player_out,
                dorsal_in: ev.dorsal_in,
                dorsal_out: ev.dorsal_out,
                points: ev.points,
                reason: ev.reason,
                descripcion: `${ev.event_type}: ${ev.player || 'Equipo'} (#${ev.dorsal || '-'})` + (ev.points ? ` (+${ev.points} pts)` : '') + (ev.reason ? ` - ${ev.reason}` : '')
            })),
            stats: {
                possession: {
                    local: stats.posesion?.local ?? 50,
                    visitor: stats.posesion?.visitor ?? 50
                },
                tackles: {
                    homeMade: stats.placajes_exito?.local ?? 0,
                    awayMade: stats.placajes_exito?.visitor ?? 0,
                    homeMissed: stats.placajes_fallados?.local ?? 0,
                    awayMissed: stats.placajes_fallados?.visitor ?? 0
                },
                mele: {
                    local_ganada: stats.meles_ganadas?.local ?? 0,
                    local_perdida: stats.meles_perdidas?.local ?? 0,
                    visitor_ganada: stats.meles_ganadas?.visitor ?? 0,
                    visitor_perdida: stats.meles_perdidas?.visitor ?? 0
                }
            }
        };
    }
};
