import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, roles }) => {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role check
    if (roles && roles.length > 0) {
        const hasRole = user?.roles?.some(r => roles.includes(r));
        if (!hasRole) {
            return (
                <div className="page-loading">
                    <div className="empty-state">
                        <h3>Access Denied</h3>
                        <p>You don't have permission to view this page.</p>
                    </div>
                </div>
            );
        }
    }

    return children;
};

export default ProtectedRoute;
