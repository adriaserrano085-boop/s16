import { apiGet, apiPost } from '../lib/apiClient';

const BASE_URL = '/rivales';

export const rivalService = {
    getAll: async () => {
        return apiGet(`${BASE_URL}/`);
    },

    getById: async (id) => {
        return apiGet(`${BASE_URL}/${id}`);
    },

    create: async (rivalData) => {
        return apiPost(`${BASE_URL}/`, rivalData);
    }
};

export default rivalService;
