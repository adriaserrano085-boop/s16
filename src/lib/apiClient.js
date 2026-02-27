const API_BASE_URL = '/api/v1';

/**
 * Función base para realizar peticiones HTTP a la API.
 * Gestiona automáticamente la inyección del Token JWT si existe,
 * y lanza errores estructurados si la respuesta no es OK.
 * 
 * @param {string} endpoint - La ruta de la API (ej: '/eventos').
 * @param {RequestInit} options - Opciones de fetch (method, body, etc).
 * @returns {Promise<any>} - La respuesta parseada en JSON.
 */
export async function apiFetch(endpoint, options = {}) {
    // Aseguramos que la URL está bien formada
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // Standardized token key used across the app
    const token = localStorage.getItem('s16_auth_token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);

        let data;
        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.indexOf("application/json") !== -1;

        if (isJson) {
            data = await response.json();
        } else {
            data = await response.text();
            // If we expected JSON but got text/HTML, and it's a 2xx, 
            // it's likely a proxy error or misconfiguration.
            if (response.ok) {
                console.warn(`API returned non-JSON response for ${url} despite 200 OK.`);
                // Return empty array/object based on common patterns? 
                // Better to throw so the .catch() in services handles it.
                throw {
                    status: response.status,
                    message: 'La respuesta del servidor no es un JSON válido',
                    data
                };
            }
        }

        if (!response.ok) {
            throw {
                status: response.status,
                message: data?.detail || data?.message || 'Error en la petición a la API',
                data
            };
        }

        return data;
    } catch (error) {
        // Log details but don't use console.error to keep it cleaner during known failures
        console.log(`API Fetch issue on ${url}:`, error.message || error);
        throw error;
    }
}

/**
 * Realiza una petición GET.
 */
export function apiGet(endpoint, options = {}) {
    return apiFetch(endpoint, { ...options, method: 'GET' });
}

/**
 * Realiza una petición POST enviando un body JSON.
 */
export function apiPost(endpoint, body, options = {}) {
    return apiFetch(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(body),
    });
}

/**
 * Realiza una petición PUT enviando un body JSON.
 */
export function apiPut(endpoint, body, options = {}) {
    return apiFetch(endpoint, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

/**
 * Realiza una petición PATCH enviando un body JSON.
 */
export function apiPatch(endpoint, body, options = {}) {
    return apiFetch(endpoint, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(body),
    });
}

/**
 * Realiza una petición DELETE.
 */
export function apiDelete(endpoint, options = {}) {
    return apiFetch(endpoint, { ...options, method: 'DELETE' });
}
