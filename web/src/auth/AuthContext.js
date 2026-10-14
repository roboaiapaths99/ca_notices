import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import keycloak from './keycloak';

const AuthContext = createContext(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize Keycloak and Local Storage
    useEffect(() => {
        const initAuth = async () => {
            try {
                // 1. Try Keycloak first
                const authenticated = await keycloak.init({
                    onLoad: 'check-sso',
                    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
                });

                if (authenticated) {
                    const userData = {
                        userId: keycloak.tokenParsed.sub,
                        email: keycloak.tokenParsed.email,
                        firstName: keycloak.tokenParsed.given_name,
                        lastName: keycloak.tokenParsed.family_name,
                        roles: keycloak.tokenParsed.realm_access?.roles || [],
                        tenantId: keycloak.tokenParsed.tenantId || 'default',
                        isKeycloak: true
                    };
                    setUser(userData);
                    localStorage.setItem('accessToken', keycloak.token);
                    localStorage.setItem('user', JSON.stringify(userData));
                    setLoading(false);
                    return;
                }

                // 2. Fallback to Local Storage (Legacy/Manual)
                const stored = localStorage.getItem('user');
                const token = localStorage.getItem('accessToken');
                if (stored && token && !JSON.parse(stored).isKeycloak) {
                    setUser(JSON.parse(stored));
                    api.get('/api/auth/me')
                        .then(res => {
                            setUser(res.data.data);
                        })
                        .catch(() => {
                            logout();
                        })
                        .finally(() => setLoading(false));
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error('Auth initialization failed:', err);
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = useCallback(async (email, password) => {
        const res = await api.post('/api/auth/login', { email, password });
        
        if (res.data.data.mfaRequired) {
            return res.data.data; // { mfaRequired: true, userId }
        }

        const { user: userData, accessToken, refreshToken } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    }, []);

    const verifyMfa = useCallback(async (userId, token) => {
        const res = await api.post('/api/auth/verify-mfa', { userId, token });
        const { user: userData, accessToken, refreshToken } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    }, []);

    const ssoLogin = useCallback(() => {
        keycloak.login();
    }, []);

    const register = useCallback(async (data) => {
        const res = await api.post('/api/auth/register', data);
        const { user: userData, accessToken, refreshToken } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    }, []);

    const logout = useCallback(async () => {
        if (user?.isKeycloak) {
            keycloak.logout();
        } else {
            try {
                await api.post('/api/auth/logout');
            } catch (e) { }
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
    }, [user]);

    const hasRole = useCallback((role) => {
        if (!user || !user.roles) return false;
        return user.roles.includes(role);
    }, [user]);

    const hasAnyRole = useCallback((...roles) => {
        if (!user || !user.roles) return false;
        return user.roles.some(r => roles.includes(r));
    }, [user]);

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        verifyMfa,
        ssoLogin,
        register,
        logout,
        hasRole,
        hasAnyRole,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
