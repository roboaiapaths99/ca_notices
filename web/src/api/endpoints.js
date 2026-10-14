import api from './axios';

// ── Clients ────────────────────────────────────────────
export const clientsApi = {
    list: (params) => api.get('/api/clients', { params }),
    getById: (id) => api.get(`/api/clients/${id}`),
    create: (data) => api.post('/api/clients', data),
    update: (id, data) => api.put(`/api/clients/${id}`, data),
    updateItPortalCredentials: (id, data) => api.post(`/api/clients/${id}/it-portal-credentials`, data),
    remove: (id) => api.delete(`/api/clients/${id}`),
};

// ── Notices ────────────────────────────────────────────
export const noticesApi = {
    list: (params) => api.get('/api/notices', { params }),
    stats: () => api.get('/api/notices/stats'),
    getById: (id) => api.get(`/api/notices/${id}`),
    create: (data) => api.post('/api/notices', data),
    update: (id, data) => api.put(`/api/notices/${id}`, data),
    assign: (id, assignedTo) => api.patch(`/api/notices/${id}/assign`, { assignedTo }),
    changeStatus: (id, status) => api.patch(`/api/notices/${id}/status`, { status }),
    updateWatchers: (id, watchers) => api.patch(`/api/notices/${id}/watchers`, { watchers }),
    sync: () => api.post('/api/notices/sync'),
    getSettings: () => api.get('/api/notices/settings'),
    updateSettings: (data) => api.put('/api/notices/settings', data),
    getActivities: (id) => api.get(`/api/notices/${id}/activities`),
    addComment: (id, text) => api.post(`/api/notices/${id}/comments`, { text }),
    analyzeNotice: (id) => api.post(`/api/notices/${id}/analyze`),
    draftAI: (id, instructions) => api.post(`/api/notices/${id}/draft-ai`, { instructions }),
    quickScan: (formData) => api.post('/api/notices/quick-scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

// ── Documents ──────────────────────────────────────────
export const documentsApi = {
    presign: (data) => api.post('/api/documents/presign', data),
    complete: (id) => api.post(`/api/documents/${id}/complete`),
    download: (id) => api.get(`/api/documents/${id}/download`),
    downloadSecure: (id) => api.get(`/api/documents/${id}/secure-download`, { responseType: 'blob' }),
    list: (params) => api.get('/api/documents', { params }),
    remove: (id) => api.delete(`/api/documents/${id}`),
};

// ── Responses ──────────────────────────────────────────
export const responsesApi = {
    list: (params) => api.get('/api/responses', { params }),
    getById: (id) => api.get(`/api/responses/${id}`),
    create: (data) => api.post('/api/responses', data),
    update: (id, data) => api.patch(`/api/responses/${id}`, data),
    submitReview: (id) => api.post(`/api/responses/${id}/submit-review`),
    addComment: (id, data) => api.post(`/api/responses/${id}/reviewer-comment`, data),
    approve: (id) => api.post(`/api/responses/${id}/approve`),
    reject: (id, data) => api.post(`/api/responses/${id}/reject`, data),
    generatePdf: (id) => api.post(`/api/responses/${id}/generate-pdf`),
    generatePacket: (id) => api.post(`/api/responses/${id}/generate-packet`),
    markFiled: (id, data) => api.post(`/api/responses/${id}/mark-filed`, data),
};

// ── Notifications ──────────────────────────────────────
export const notificationsApi = {
    list: (params) => api.get('/api/notifications', { params }),
    unreadCount: () => api.get('/api/notifications/unread-count'),
    markRead: (id) => api.patch(`/api/notifications/${id}/read`),
    markAllRead: () => api.post('/api/notifications/read-all'),
};

// ── Client Portal ──────────────────────────────────────
export const clientPortalApi = {
    login: (data) => api.post('/api/client-portal/login', data),
    requestOtp: (email) => api.post('/api/client-portal/request-otp', { email }),
    verifyOtp: (data) => api.post('/api/client-portal/verify-otp', data),
    getMe: () => api.get('/api/client-portal/me'),
    getNotices: () => api.get('/api/client-portal/notices'),
    getNoticeById: (id) => api.get(`/api/client-portal/notices/${id}`),
    uploadDocument: (id, formData) => api.post(`/api/client-portal/notices/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    downloadResponsePdf: (id) => api.get(`/api/client-portal/notices/${id}/response/pdf`, { responseType: 'blob' }),
};

// ── Admin ──────────────────────────────────────────────
export const adminApi = {
    getSettings: () => api.get('/api/admin/settings'),
    updateSettings: (data) => api.put('/api/admin/settings', data),
    listUsers: (params) => api.get('/api/admin/users', { params }),
    getUser: (id) => api.get(`/api/admin/users/${id}`),
    createUser: (data) => api.post('/api/admin/users', data),
    updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
    resetPassword: (id, data) => api.post(`/api/admin/users/${id}/reset-password`, data),
    disableUser: (id) => api.delete(`/api/admin/users/${id}`),
    listAuditLogs: (params) => api.get('/api/admin/audit-logs', { params }),
};

// ── Templates ──────────────────────────────────────────
export const templatesApi = {
    list: (params) => api.get('/api/templates', { params }),
    getById: (id) => api.get(`/api/templates/${id}`),
    create: (data) => api.post('/api/templates', data),
    update: (id, data) => api.put(`/api/templates/${id}`, data),
    remove: (id) => api.delete(`/api/templates/${id}`),
};

// ── Integrations ──────────────────────────────────────
export const integrationApi = {
    syncItd: (data) => api.post('/api/integrations/itd/sync', data),
    syncGstn: (data) => api.post('/api/integrations/gstn/sync', data),
    verifyPan: (pan) => api.get(`/api/integrations/verify-pan/${pan}`),
};

// ── Users (legacy, for dropdowns) ──────────────────────
export const usersApi = {
    list: (params) => api.get('/api/admin/users', { params }),
};

// ── Document Requests (CA-facing) ──────────────────────
export const documentRequestsApi = {
    list: (params) => api.get('/api/document-requests', { params }),
    getById: (id) => api.get(`/api/document-requests/${id}`),
    create: (data) => api.post('/api/document-requests', data),
};

// ── Public Portal (client-facing, no auth) ─────────────
export const portalApi = {
    getPortal: (token) => api.get(`/api/document-requests/portal/${token}`),
    uploadDocument: (token, docIndex, formData) =>
        api.post(`/api/document-requests/portal/${token}/upload/${docIndex}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),
};
// ── Analytics (Dashboard) ──────────────────────────────
export const analyticsApi = {
    getStats: () => api.get('/api/analytics/dashboard'),
};

// ── Data Import (Tally/ERP Sync) ───────────────────────
export const importApi = {
    importLedger: (formData) => api.post('/api/import/ledger', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

// ── MFA ────────────────────────────────────────────────
export const mfaApi = {
    setup: () => api.post('/api/mfa/setup'),
    verifyAndEnable: (token) => api.post('/api/mfa/verify', { token }),
    disable: (token) => api.post('/api/mfa/disable', { token }),
};
