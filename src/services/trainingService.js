import { apiGet, apiPost, apiPut } from '../lib/apiClient';

const BASE_URL = '/entrenamientos';

export const trainingService = {
    getAll: async () => {
        return apiGet(`${BASE_URL}/`);
    },

    getById: async (id) => {
        return apiGet(`${BASE_URL}/${id}`);
    },

    create: async (trainingData) => {
        return apiPost(`${BASE_URL}/`, trainingData);
    },

    update: async (eventId, trainingData) => {
        // Asumiendo que podemos actualizar por evento,
        // o quizás debamos buscar por eventId primero.
        // Lo mapeamos a la actualización estándar de recurso si el backend la expone.
        return apiPut(`${BASE_URL}/${eventId}`, trainingData);
    }
};

export default trainingService;
