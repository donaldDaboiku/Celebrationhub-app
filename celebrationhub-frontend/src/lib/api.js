const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);

const clearStoredAuth = () => {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_org');
};

const redirectToLogin = () => {
    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
};

const notifyOrganizationUpdated = (organization) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('organization-updated', { detail: organization }));
    }
};

const notifyOrganizationSettingsUpdated = (settings) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('organization-settings-updated', { detail: settings }));
    }
};

const normalizeErrorMessage = (payload, response) => {
    if (payload?.message) {
        return payload.message;
    }

    const firstValidationError = payload?.errors
        ? Object.values(payload.errors).flat().find(Boolean)
        : null;

    if (firstValidationError) {
        return firstValidationError;
    }

    return `Request failed with status ${response.status}`;
};

const buildHeaders = (options = {}) => {
    const headers = new Headers(options.headers || {});
    const token = getToken();
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }

    if (!isFormData && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
};

const parseResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        return response.json();
    }

    return response.text();
};

export const fetchAPI = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: buildHeaders(options),
    });

    if (response.status === 401) {
        clearStoredAuth();
        redirectToLogin();
        throw new Error('Unauthenticated');
    }

    const data = await parseResponse(response).catch(() => ({}));

    if (!response.ok) {
        throw new Error(normalizeErrorMessage(data, response));
    }

    return data;
};

export const downloadFile = async (endpoint, filename, options = {}) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: buildHeaders(options),
    });

    if (response.status === 401) {
        clearStoredAuth();
        redirectToLogin();
        throw new Error('Unauthenticated');
    }

    if (!response.ok) {
        const payload = await parseResponse(response).catch(() => ({}));
        throw new Error(normalizeErrorMessage(payload, response));
    }

    const blob = await response.blob();

    if (typeof window === 'undefined') {
        return blob;
    }

    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(objectUrl);

    return true;
};

const setStoredOrganization = (organization) => {
    if (typeof window !== 'undefined' && organization) {
        localStorage.setItem('auth_org', JSON.stringify(organization));
        notifyOrganizationUpdated(organization);
    }
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
        setStoredOrganization(data.data.organization);
    }

    return data;
};

export const register = async ({ organization_name, name, email, password }) => {
    const data = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ organization_name, name, email, password }),
    });

    if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.data.user));
        setStoredOrganization(data.data.organization);
    }

    return data;
};

export const requestAccessReset = async (email) =>
    fetchAPI('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });

export const resetAccess = async ({ email, token, name, password, password_confirmation }) =>
    fetchAPI('/auth/reset-access', {
        method: 'POST',
        body: JSON.stringify({ email, token, name, password, password_confirmation }),
    });

export const logout = async () => {
    try {
        await fetchAPI('/auth/logout', { method: 'POST' });
    } catch {
        // Ignore logout API failures and clear local state anyway.
    } finally {
        clearStoredAuth();
        redirectToLogin();
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

export const getStoredOrganization = () => {
    if (typeof window === 'undefined') return null;
    try {
        return JSON.parse(localStorage.getItem('auth_org'));
    } catch {
        return null;
    }
};

export const isAuthenticated = () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('auth_token');
};

// --- Analytics ---

export const getDashboardAnalytics = async (period = 'monthly') => {
    const queryString = new URLSearchParams({ period }).toString();
    return fetchAPI(`/analytics/dashboard?${queryString}`);
};

// --- Members ---

export const getMembers = async (params = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
            searchParams.set(key, value);
        }
    });

    const queryString = searchParams.toString();
    return fetchAPI(`/members${queryString ? `?${queryString}` : ''}`);
};

export const createMember = async (payload) =>
    fetchAPI('/members', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

export const updateMember = async (memberId, payload) =>
    fetchAPI(`/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });

export const getMember = async (memberId) => fetchAPI(`/members/${memberId}`);

export const deleteMember = async (memberId) =>
    fetchAPI(`/members/${memberId}`, {
        method: 'DELETE',
    });

export const uploadMemberPhoto = async (memberId, file) => {
    const formData = new FormData();
    formData.append('photo', file);

    return fetchAPI(`/members/${memberId}/photo`, {
        method: 'POST',
        body: formData,
    });
};

export const removeMemberPhoto = async (memberId) =>
    fetchAPI(`/members/${memberId}/photo`, {
        method: 'DELETE',
    });

export const importMembers = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return fetchAPI('/members/import', {
        method: 'POST',
        body: formData,
    });
};

export const downloadMembersTemplate = async () =>
    downloadFile('/members/import/template', 'members-import-template.xlsx');

export const exportMembers = async () =>
    downloadFile('/members/export', `members-export-${new Date().toISOString().slice(0, 10)}.xlsx`);

// --- Organization settings ---

export const getOrganizationSettings = async () => fetchAPI('/organization/settings');

export const updateOrganizationSettings = async (payload) => {
    const response = await fetchAPI('/organization/settings', {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });

    if (response?.data) {
        setStoredOrganization({
            id: response.data.id,
            name: response.data.name,
            slug: response.data.slug,
            logo_url: response.data.logo_url,
        });
        notifyOrganizationSettingsUpdated(response.data.settings || {});
    }

    return response;
};

export const updateOrganizationMessageTemplates = async (payload) =>
    fetchAPI('/organization/messages', {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });

export const uploadOrganizationLogo = async (file) => {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await fetchAPI('/organization/logo', {
        method: 'POST',
        body: formData,
    });

    const currentOrganization = getStoredOrganization();
    if (currentOrganization) {
        setStoredOrganization({
            ...currentOrganization,
            logo_url: response.data.logo_url,
        });
    }

    return response;
};

export const removeOrganizationLogo = async () => {
    const response = await fetchAPI('/organization/logo', {
        method: 'DELETE',
    });

    const currentOrganization = getStoredOrganization();
    if (currentOrganization) {
        setStoredOrganization({
            ...currentOrganization,
            logo_url: null,
        });
    }

    return response;
};

// --- Templates ---

export const getTemplates = async () => fetchAPI('/templates');

export const createTemplate = async (payload) =>
    fetchAPI('/templates', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

export const updateTemplate = async (templateId, payload) =>
    fetchAPI(`/templates/${templateId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });

export const deleteTemplate = async (templateId) =>
    fetchAPI(`/templates/${templateId}`, {
        method: 'DELETE',
    });

export const setDefaultTemplate = async (templateId, type) =>
    fetchAPI(`/templates/${templateId}/set-default`, {
        method: 'POST',
        body: JSON.stringify({ type }),
    });

export const getTemplatePreview = async (templateId) => fetchAPI(`/templates/${templateId}/preview`);

// --- Manual celebrations / resend ---

export const getCelebrations = async (params = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
            searchParams.set(key, value);
        }
    });

    const queryString = searchParams.toString();
    return fetchAPI(`/celebrations${queryString ? `?${queryString}` : ''}`);
};

export const sendCelebrationNow = async (payload) =>
    fetchAPI('/celebrations', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

export const resendCelebration = async (celebrationId) =>
    fetchAPI(`/celebrations/${celebrationId}/resend`, {
        method: 'POST',
    });

// --- Bulk campaigns ---

export const getCampaigns = async () => fetchAPI('/campaigns');

export const getCampaignDetails = async (campaignId) => fetchAPI(`/campaigns/${campaignId}`);

export const createCampaign = async (payload) =>
    fetchAPI('/campaigns', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

export const sendCampaign = async (campaignId) =>
    fetchAPI(`/campaigns/${campaignId}/send`, {
        method: 'POST',
    });

export const resendFailedCampaign = async (campaignId) =>
    fetchAPI(`/campaigns/${campaignId}/resend-failed`, {
        method: 'POST',
    });

export const archiveCampaign = async (campaignId) =>
    fetchAPI(`/campaigns/${campaignId}/archive`, {
        method: 'PATCH',
    });

export const deleteCampaign = async (campaignId) =>
    fetchAPI(`/campaigns/${campaignId}`, {
        method: 'DELETE',
    });
