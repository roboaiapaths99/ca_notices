import axios from 'axios';
import keycloak from '../auth/keycloak';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor — attach access token
api.interceptors.request.use(
    (config) => {
        if (config.url && config.url.includes('/api/client-portal')) {
            const clientToken = localStorage.getItem('clientAccessToken');
            if (clientToken) {
                config.headers.Authorization = `Bearer ${clientToken}`;
            }
        } else {
            const token = localStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — auto-refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // 1. If Keycloak user, refresh via Keycloak
            if (keycloak.authenticated) {
                try {
                    const refreshed = await keycloak.updateToken(70);
                    if (refreshed) {
                        localStorage.setItem('accessToken', keycloak.token);
                    }
                    originalRequest.headers.Authorization = `Bearer ${keycloak.token}`;
                    return api(originalRequest);
                } catch (err) {
                    keycloak.logout();
                    return Promise.reject(err);
                }
            }

            // 2. If Local user, refresh via API
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');

                const response = await axios.post(`${API_URL}/api/auth/refresh`, {
                    refreshToken,
                }, { withCredentials: true });

                const { accessToken, refreshToken: newRefreshToken } = response.data.data;
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', newRefreshToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed — force logout
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
