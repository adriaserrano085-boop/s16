import { apiGet, apiPost, apiPut } from '../lib/apiClient';

const BASE_URL = '/partidos';

export const matchService = {
    getAll: async () => {
        return apiGet(`${BASE_URL}/`).catch(() => []);
    },

    create: async (matchData) => {
        return apiPost(`${BASE_URL}/`, matchData);
    },

    update: async (id, matchData) => {
        return apiPut(`${BASE_URL}/${id}`, matchData);
    }
};

export default matchService;
