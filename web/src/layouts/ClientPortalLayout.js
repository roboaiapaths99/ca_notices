import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useClientAuth } from '../auth/ClientAuthContext';
import { LogOut, Shield } from 'lucide-react';

const ClientPortalLayout = () => {
    const { isAuthenticated, loading, clientUser, logout } = useClientAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/portal/login" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Topbar */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Shield className="h-8 w-8 text-blue-600 mr-2" />
                            <span className="text-xl font-bold text-gray-900">Client Portal</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                                Welcome, <span className="font-semibold text-gray-900">{clientUser?.name}</span>
                            </span>
                            <button
                                onClick={logout}
                                className="flex items-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                <LogOut className="h-4 w-4 mr-1.5" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
            
            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <p className="text-center text-sm text-gray-500">
                        Secure Client Portal &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default ClientPortalLayout;
