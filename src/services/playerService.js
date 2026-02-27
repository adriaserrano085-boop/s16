import { apiGet, apiPost, apiPut, apiDelete } from '../lib/apiClient';

const BASE_URL = '/jugadores_propios';

const playerService = {
    getAll: async () => {
        // Asumiendo que /api/v1/jugadores_propios/ devuelve la lista de jugadores.
        // Si el backend espera select(), tendremos que parsearlo una vez devuelto si fuera necesario.
        return apiGet(`${BASE_URL}/`).catch(() => []);
    },

    getById: async (id) => {
        return apiGet(`${BASE_URL}/${id}`);
    },

    create: async (player) => {
        return apiPost(`${BASE_URL}/`, player);
    },

    update: async (id, player) => {
        return apiPut(`${BASE_URL}/${id}`, player);
    },

    delete: async (id) => {
        return apiDelete(`${BASE_URL}/${id}`);
    }
};

export default playerService;
