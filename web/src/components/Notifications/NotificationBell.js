import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../api/endpoints';
import { Bell, Check, AlertTriangle, Clock, FileText, Users, X, CheckCheck } from 'lucide-react';
import './Notifications.css';

const TYPE_ICONS = {
    OVERDUE: AlertTriangle,
    DEADLINE_CRITICAL: AlertTriangle,
    DEADLINE_WARNING: Clock,
    ASSIGNMENT: Users,
    STATUS_CHANGE: FileText,
    REVIEW_REQUEST: FileText,
    APPROVAL: Check,
    REJECTION: AlertTriangle,
    SYSTEM: Bell,
};

const TYPE_COLORS = {
    OVERDUE: '#DC2626',
    DEADLINE_CRITICAL: '#D97706',
    DEADLINE_WARNING: '#2563EB',
    ASSIGNMENT: '#7C3AED',
    APPROVAL: '#059669',
    REJECTION: '#DC2626',
};

const NotificationBell = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [showPanel, setShowPanel] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef(null);
    const navigate = useNavigate();

    // Fetch unread count (poll every 60s)
    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await notificationsApi.unreadCount();
            setUnreadCount(res.data.data.unreadCount);
        } catch (err) {
            // Silently fail — user may not be authenticated yet
        }
    }, []);

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    // Load notifications when panel opens
    const openPanel = async () => {
        setShowPanel(true);
        setLoading(true);
        try {
            const res = await notificationsApi.list({ limit: 20 });
            setNotifications(res.data.data);
        } catch (err) {
            console.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (notif) => {
        try {
            await notificationsApi.markRead(notif._id);
            setNotifications(prev => prev.map(n =>
                n._id === notif._id ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (notif.link) navigate(notif.link);
        } catch (err) {
            console.error('Failed to mark read');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsApi.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all read');
        }
    };

    // Close panel on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setShowPanel(false);
            }
        };
        if (showPanel) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPanel]);

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <div className="notification-bell-wrapper" ref={panelRef}>
            <button
                className="btn btn-ghost notification-bell-btn"
                onClick={() => showPanel ? setShowPanel(false) : openPanel()}
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {showPanel && (
                <div className="notification-panel">
                    <div className="notification-panel-header">
                        <h3>Notifications</h3>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {unreadCount > 0 && (
                                <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead} title="Mark all read">
                                    <CheckCheck size={16} />
                                </button>
                            )}
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowPanel(false)}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="notification-list">
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" style={{ margin: 'auto' }}></div></div>
                        ) : notifications.length === 0 ? (
                            <div className="notification-empty">
                                <Bell size={28} style={{ color: 'var(--text-muted)' }} />
                                <span>No notifications</span>
                            </div>
                        ) : (
                            notifications.map(notif => {
                                const Icon = TYPE_ICONS[notif.type] || Bell;
                                const color = TYPE_COLORS[notif.type] || 'var(--text-muted)';
                                return (
                                    <div
                                        key={notif._id}
                                        className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                        onClick={() => !notif.read && handleMarkRead(notif)}
                                        style={{ cursor: notif.link ? 'pointer' : 'default' }}
                                    >
                                        <div className="notification-icon" style={{ color }}>
                                            <Icon size={16} />
                                        </div>
                                        <div className="notification-content">
                                            <div className="notification-title">{notif.title}</div>
                                            {notif.message && <div className="notification-message">{notif.message}</div>}
                                            <div className="notification-time">{timeAgo(notif.createdAt)}</div>
                                        </div>
                                        {!notif.read && <div className="notification-dot"></div>}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
