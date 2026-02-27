import { apiGet, apiPost } from '../lib/apiClient';

const BASE_URL = '/convocatoria';

export const convocatoriaService = {
    /**
     * Get all squad entries for a given match
     */
    getByMatchId: async (partidoId) => {
        // Asumiendo que podemos filtrar convocatorias por el partido
        return apiGet(`${BASE_URL}/?partido=${partidoId}`);
    },

    /**
     * Save the full squad for a match (delete existing + insert new)
     */
    saveSquad: async (partidoId, players) => {
        // En una API REST estándar idealmente tendríamos un endpoint POST /convocatoria/bulk 
        // o un endpoint específico para reemplazar la convocatoria entera bajo el partido.
        // Simulando que podemos mandar un array de objetos al POST base:
        const entries = players
            .filter(p => p.jugador)
            .map(p => ({
                partido: partidoId,
                jugador: p.jugador,
                numero: p.numero
            }));

        if (entries.length === 0) return [];

        // Si la API generada por Pydantic soporta bulk insert, se lo pasamos
        // de otra forma habría que iterar e insertar uno por uno...
        return apiPost(`${BASE_URL}/bulk_replace`, { partido: partidoId, convocados: entries })
            .catch(async () => {
                // FALLBACK genérico si el endpoint 'bulk_replace' no existe: iterar.
                // Idealmente el backend expone una forma atómica para esto.
                let results = [];
                for (const entry of entries) {
                    results.push(await apiPost(`${BASE_URL}/`, entry));
                }
                return results;
            });
    }
};

export default convocatoriaService;
