
export const reportService = {
    /**
     * Converts a structured analysis JSON into a professional Markdown report.
     * @param {Object} data - The analysis data object.
     * @returns {string} - The formatted Markdown report.
     */
    jsonToMarkdown: (data) => {
        try {
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
            "resumen": "Breve resumen ejecutivo del partido (2-3 líneas)...",
            "analisis_dinamico": "Detalles del flujo del partido, ritmos y momentos clave...",
            "scouting_fases": {
                "mele": "Dominio...",
                "touch": "...",
                "rucks": "..."
            },
            "ensayos": [
                { "minuto": 15, "equipo": "Local", "descripcion": "Jugada de..." }
            ],
            "disciplina": "Comentarios sobre tarjetas y faltas...",
            "estadisticas": {
                "posesion": { "local": 50, "visitante": 50 },
                "placajes_hechos": { "local": 0, "visitante": 0 },
                "placajes_fallados": { "local": 0, "visitante": 0 },
                "turnovers": { "local": 0, "visitante": 0 },
                "penaltis": { "local": 0, "visitante": 0 },
                "mele": {
                    "local_ganada": 0, "local_perdida": 0,
                    "visitante_ganada": 0, "visitante_perdida": 0
                },
                "touch": {
                    "local_ganada": 0, "local_perdida": 0,
                    "visitante_ganada": 0, "visitante_perdida": 0
                }
            },
            "conclusion": "Resumen final y puntos de mejora..."
        };
    }
};
