const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/**
 * Core fetch wrapper. Attaches Bearer token from localStorage.
 * Throws on non-2xx with the API error message.
 */
export const fetchAPI = async (endpoint, options = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    // 401 → clear token and redirect to login
    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            window.location.href = '/login';
        }
        throw new Error('Unauthenticated');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
};

// --- Auth helpers ---

export const login = async (email, password) => {
    const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.data.user));
        localStorage.setItem('auth_org',  JSON.stringify(data.data.organization));
    }

    return data;
};

export const logout = async () => {
    try {
        await fetchAPI('/auth/logout', { method: 'POST' });
    } catch (_) {
        // ignore — clear local state regardless
    } finally {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_org');
            window.location.href = '/login';
        }
    }
};

export const getStoredUser = () => {
    if (typeof window === 'undefined') return null;
    try {
        return JSON.parse(localStorage.getItem('auth_user'));
    } catch {
        return null;
    }
};

export const isAuthenticated = () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('auth_token');
};
