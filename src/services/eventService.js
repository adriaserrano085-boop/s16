import { apiGet, apiPost, apiPut, apiDelete } from '../lib/apiClient';

const BASE_URL = '/eventos';

export const eventService = {
    getAll: async () => {
        return apiGet(`${BASE_URL}`).catch(() => []);
    },

    create: async (eventData) => {
        return apiPost(`${BASE_URL}`, eventData);
    },

    update: async (id, eventData) => {
        return apiPut(`${BASE_URL}/${id}`, eventData);
    },

    delete: async (id) => {
        return apiDelete(`${BASE_URL}/${id}`);
    }
};

export default eventService;
