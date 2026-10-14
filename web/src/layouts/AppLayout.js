import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
    LayoutDashboard, Users, FileText, Inbox, FolderOpen,
    PenTool, Settings, Shield, BarChart3,
    LogOut, Menu, X, ChevronDown, Calendar, Bell, Camera, Send, RefreshCw, Clock, Activity
} from 'lucide-react';
import NotificationBell from '../components/Notifications/NotificationBell';
import './AppLayout.css';

const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Notice Inbox', path: '/notices', icon: Inbox },
    { name: 'Scan Notice', path: '/notices/scan', icon: Camera },
    { name: 'Response Studio', path: '/responses', icon: PenTool },
    { name: 'Compliance Calendar', path: '/notices/calendar', icon: Calendar },
    { name: 'Document Vault', path: '/documents', icon: FolderOpen },
    { name: 'Doc Requests', path: '/document-requests', icon: Send },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['Partner', 'TenantAdmin', 'SuperAdmin'] },
    { name: 'Tally Sync', path: '/tools/sync', icon: RefreshCw },
];

const adminNav = [
    { name: 'Portal Sync', path: '/tools/portal-sync', icon: RefreshCw },
    { name: 'User Management', path: '/admin/users', icon: Shield },
    { name: 'Forensic Logs', path: '/admin/forensic-logs', icon: Activity, roles: ['TenantAdmin'] },
    { name: 'Templates', path: '/admin/templates', icon: FileText },
    { name: 'Alert Config', path: '/settings/alerts', icon: Bell },
    { name: 'System Settings', path: '/admin/settings', icon: Settings },
];

const AppLayout = ({ children }) => {
    const { user, logout, hasAnyRole } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [profileOpen, setProfileOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isAdmin = hasAnyRole('TenantAdmin', 'SuperAdmin');

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="logo-icon">NR</div>
                        {sidebarOpen && <span className="logo-text">NoticeRadar</span>}
                    </div>
                    <button className="btn-ghost sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section">
                        {sidebarOpen && <span className="nav-section-title">Main</span>}
                        {navigation.map((item) => {
                            if (item.roles && !hasAnyRole(...item.roles)) return null;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                                    title={item.name}
                                >
                                    <item.icon size={20} />
                                    {sidebarOpen && <span>{item.name}</span>}
                                </NavLink>
                            );
                        })}
                    </div>

                    {isAdmin && (
                        <div className="nav-section">
                            {sidebarOpen && <span className="nav-section-title">Administration</span>}
                            {adminNav.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                                    title={item.name}
                                >
                                    <item.icon size={20} />
                                    {sidebarOpen && <span>{item.name}</span>}
                                </NavLink>
                            ))}
                        </div>
                    )}
                </nav>
            </aside>

            {/* Main area */}
            <div className="main-area">
                {/* Topbar */}
                <header className="topbar">
                    <div className="topbar-left">
                        <button className="btn-ghost topbar-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <Menu size={20} />
                        </button>
                    </div>

                    <div className="topbar-right">
                        <NotificationBell />

                        <div className="profile-dropdown">
                            <button
                                className="profile-trigger"
                                onClick={() => setProfileOpen(!profileOpen)}
                            >
                                <div className="avatar">
                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                </div>
                                {<span className="profile-name">{user?.firstName} {user?.lastName}</span>}
                                <ChevronDown size={16} />
                            </button>

                            {profileOpen && (
                                <div className="profile-menu">
                                    <div className="profile-menu-header">
                                        <span className="profile-menu-name">{user?.firstName} {user?.lastName}</span>
                                        <span className="profile-menu-email">{user?.email}</span>
                                        <span className="badge badge-primary">{user?.roles?.[0]}</span>
                                    </div>
                                    <div className="profile-menu-divider"></div>
                                    <NavLink to="/profile" className="profile-menu-item" onClick={() => setProfileOpen(false)}>
                                        <Settings size={16} /> My Account
                                    </NavLink>
                                    <button className="profile-menu-item profile-menu-item-danger" onClick={handleLogout}>
                                        <LogOut size={16} /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="page-content">
                    {children}
                </main>
            </div>

            {/* Profile dropdown backdrop */}
            {profileOpen && <div className="backdrop" onClick={() => setProfileOpen(false)}></div>}
        </div>
    );
};

export default AppLayout;
