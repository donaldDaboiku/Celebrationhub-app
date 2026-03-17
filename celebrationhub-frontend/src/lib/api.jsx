const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export const fetchAPI = async (endpoint, options = {}) => {
    const token = localStorage.getItem('auth_token');

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    if  (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
    }
    return response.json();
}