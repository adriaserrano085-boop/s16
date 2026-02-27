import { apiGet, apiPost, apiPut } from '../lib/apiClient';

const BASE_URL = '/analisis_partido';

export const analysisService = {
    // Get analysis for a match
    getByEventId: async (eventId) => {
        const data = await apiGet(`${BASE_URL}/?evento_id=${eventId}`);
        return data && data.length > 0 ? data[0] : null;
    },

    getByExternalMatchId: async (externalId) => {
        const data = await apiGet(`${BASE_URL}/?partido_externo_id=${externalId}`);
        return data && data.length > 0 ? data[0] : null;
    },

    // Get all analyses (for evolution calculation)
    getAll: async () => {
        return apiGet(`${BASE_URL}/`);
    },

    // Save or update analysis
    upsert: async (analysisData) => {
        const hasEventId = !!analysisData.evento_id;
        const hasExternalId = !!analysisData.partido_externo_id;
        const hasMatchId = !!analysisData.partido_id;

        if (!hasEventId && !hasExternalId && !hasMatchId) {
            throw new Error('No se proporcionó ningún identificador de partido válido.');
        }

        let existingRecord = null;

        // Try to find existing record
        if (hasExternalId) {
            const results = await apiGet(`${BASE_URL}/?partido_externo_id=${analysisData.partido_externo_id}`);
            if (results && results.length > 0) existingRecord = results[0];
        }

        if (!existingRecord && hasEventId) {
            const results = await apiGet(`${BASE_URL}/?evento_id=${analysisData.evento_id}`);
            if (results && results.length > 0) existingRecord = results[0];
        }

        if (!existingRecord && hasMatchId) {
            const results = await apiGet(`${BASE_URL}/?partido_id=${analysisData.partido_id}`);
            if (results && results.length > 0) existingRecord = results[0];
        }

        const payload = { ...analysisData };
        if (!hasEventId) delete payload.evento_id;
        if (!hasExternalId) delete payload.partido_externo_id;
        if (!hasMatchId) delete payload.partido_id;

        if (existingRecord) {
            return apiPut(`${BASE_URL}/${existingRecord.id}`, payload);
        } else {
            return apiPost(`${BASE_URL}/`, payload);
        }
    }
};

export default analysisService;
