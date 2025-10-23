const API_BASE_PATH = 'sources/php/';

async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_PATH}${endpoint}`, options);
        if (!response.ok) {
            throw new Error(`Error en la respuesta del servidor para ${endpoint}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error en la llamada a la API (${endpoint}):`, error);
        // Devolvemos un objeto de error consistente para que el resto del código pueda manejarlo
        return { success: false, message: error.message };
    }
}

// --- Cronogramas ---
export const fetchProgramacion = (fecha) => apiCall(`obtener_cronogramas.php?fecha=${fecha}`);
export const syncCronogramas = (calendario) => apiCall('sincronizar_cronogramas.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calendario })
});
export const manageCronograma = (method, data) => apiCall('gestionar_cronograma.php', {
    method: method, // 'POST' o 'DELETE'
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});

// --- Autenticación ---
export const login = (username, password) => apiCall('login.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
});
export const checkSession = () => apiCall('check_session.php');
export const logout = () => apiCall('logout.php');

// --- Noticias ---
export const getNoticias = (id = null) => {
    const endpoint = id ? `gestionar_noticias.php?action=get&id=${id}` : 'gestionar_noticias.php?action=get';
    return apiCall(endpoint);
};

export const saveNoticia = (data, imagenFile) => {
    const formData = new FormData();
    formData.append('titulo', data.titulo);
    formData.append('fecha', data.fecha);
    formData.append('url', data.url);
    if (data.id) formData.append('id', data.id);
    if (imagenFile) formData.append('imagen', imagenFile);

    return apiCall('gestionar_noticias.php', {
        method: 'POST',
        body: formData
    });
};

export const deleteNoticia = (id) => {
    const formData = new FormData();
    formData.append('id', id);
    formData.append('action', 'delete');
    return apiCall('gestionar_noticias.php', {
        method: 'POST',
        body: formData
    });
};

// --- Boletín ---
export const getBoletin = () => apiCall('gestionar_boletin.php?action=get');

export const saveBoletin = (pdfFile) => {
    const formData = new FormData();
    formData.append('boletin_pdf', pdfFile);
    return apiCall('gestionar_boletin.php?action=save', {
        method: 'POST',
        body: formData
    });
};

export const deleteBoletin = () => apiCall('gestionar_boletin.php?action=delete', {
    method: 'POST'
});

// --- Mensajes de Oyentes ---
export const enviarMensaje = (data) => apiCall('enviar_mensaje.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});

export const getMensajes = () => apiCall('obtener_mensajes.php');

export const manageMensaje = (action, id) => apiCall('gestionar_mensajes.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, id })
});
