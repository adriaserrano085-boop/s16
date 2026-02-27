import { apiGet, apiPost, apiPut } from '../lib/apiClient';

const BASE_URL = '/users';

const userService = {
    getAll: async () => {
        return apiGet(`${BASE_URL}/`).catch(() => []);
    },

    getPending: async () => {
        return apiGet(`${BASE_URL}/pending/`).catch(() => []);
    },

    getById: async (id) => {
        return apiGet(`${BASE_URL}/${id}`);
    },

    update: async (id, userData) => {
        return apiPut(`${BASE_URL}/${id}`, userData);
    },

    assignRole: async (targetUserId, newRole) => {
        return apiPost(`${BASE_URL}/assign-role/`, {
            target_user_id: targetUserId,
            new_role: newRole
        });
    },

    linkFamily: async (familyId, playerId) => {
        return apiPost(`${BASE_URL}/link-family/`, {
            family_id: familyId,
            player_id: playerId
        });
    }
};

export default userService;
