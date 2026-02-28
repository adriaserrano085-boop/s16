import { apiGet, apiPost, apiPut } from '../lib/apiClient';

const BASE_URL = '/analisis_partido';

export const analysisService = {
    // Get analysis by internal match event ID
    getByEventId: async (eventId) => {
        const data = await apiGet(`${BASE_URL}?evento=${eventId}`);
        return data && data.length > 0 ? data[0] : null;
    },

    // Get analysis by external match ID
    getByExternalMatchId: async (externalId) => {
        const data = await apiGet(`${BASE_URL}?partido_externo=${externalId}`);
        return data && data.length > 0 ? data[0] : null;
    },

    // Get analysis by internal partido ID
    getByPartidoId: async (partidoId) => {
        const data = await apiGet(`${BASE_URL}?partido=${partidoId}`);
        return data && data.length > 0 ? data[0] : null;
    },

    // Get all analyses
    getAll: async () => {
        return apiGet(BASE_URL);
    },

    // Save or update analysis (upsert)
    upsert: async (analysisData) => {
        const { partido_id, partido_externo_id, evento_id, ...rest } = analysisData;

        if (!partido_id && !partido_externo_id && !evento_id) {
            throw new Error('No se proporcionó ningún identificador de partido válido.');
        }

        let existingRecord = null;

        // Try to find existing record using correct backend param names
        if (partido_externo_id) {
            const results = await apiGet(`${BASE_URL}?partido_externo=${partido_externo_id}`).catch(() => []);
            if (results && results.length > 0) existingRecord = results[0];
        }
        if (!existingRecord && evento_id) {
            const results = await apiGet(`${BASE_URL}?evento=${evento_id}`).catch(() => []);
            if (results && results.length > 0) existingRecord = results[0];
        }
        if (!existingRecord && partido_id) {
            const results = await apiGet(`${BASE_URL}?partido=${partido_id}`).catch(() => []);
            if (results && results.length > 0) existingRecord = results[0];
        }

        // Build payload with actual DB column names
        const payload = { ...rest };
        if (partido_id) payload.partido_id = partido_id;
        if (partido_externo_id) payload.partido_externo_id = partido_externo_id;
        if (evento_id) payload.evento_id = evento_id;

        if (existingRecord) {
            return apiPut(`${BASE_URL}/${existingRecord.id}`, payload);
        } else {
            return apiPost(BASE_URL, payload);
        }
    }
};

export default analysisService;
