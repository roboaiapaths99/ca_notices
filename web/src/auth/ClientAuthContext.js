import React, { createContext, useContext, useState, useEffect } from 'react';
import { clientPortalApi } from '../api/endpoints';

const ClientAuthContext = createContext();

export const useClientAuth = () => useContext(ClientAuthContext);

export const ClientAuthProvider = ({ children }) => {
    const [clientUser, setClientUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('clientAccessToken');
        if (token) {
            checkAuth();
        } else {
            setLoading(false);
        }
    }, []);

    const checkAuth = async () => {
        try {
            const res = await clientPortalApi.getMe();
            setClientUser(res.data.data);
        } catch (error) {
            localStorage.removeItem('clientAccessToken');
            setClientUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await clientPortalApi.login({ email, password });
        localStorage.setItem('clientAccessToken', res.data.data.token);
        await checkAuth();
    };

    const requestOtp = async (email) => {
        return await clientPortalApi.requestOtp(email);
    };

    const verifyOtp = async (email, otp) => {
        const res = await clientPortalApi.verifyOtp({ email, otp });
        localStorage.setItem('clientAccessToken', res.data.data.token);
        await checkAuth();
    };

    const logout = () => {
        localStorage.removeItem('clientAccessToken');
        setClientUser(null);
    };

    return (
        <ClientAuthContext.Provider value={{ 
            clientUser, 
            login, 
            requestOtp, 
            verifyOtp, 
            logout, 
            isAuthenticated: !!clientUser, 
            loading 
        }}>
            {children}
        </ClientAuthContext.Provider>
    );
};
