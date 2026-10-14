import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, Filter, Inbox, AlertTriangle, Clock, CheckCircle,
    FileText, Calendar, X, Loader, RefreshCw, ChevronRight, CheckSquare, Square
} from 'lucide-react';
import './Notices.css';
import NoticeDrawer from './NoticeDrawer';
import QuickScanNotice from './QuickScanNotice';
import { noticesApi } from '../../api/endpoints';

const STATUS_OPTIONS = ['All', 'Critical', 'Pending', 'Resolved', 'InProgress'];
const PRIORITY_COLORS = { Low: 'success', Medium: 'info', High: 'warning', Critical: 'critical' };

const NoticeInbox = () => {
    const [notices, setNotices] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [selectedNotice, setSelectedNotice] = useState(null);
    const [showQuickScan, setShowQuickScan] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');
    const [selectedIds, setSelectedIds] = useState([]);

    const fetchNotices = useCallback(async () => {
        setLoading(true);
        try {
            const res = await noticesApi.list({ limit: 50 });
            setNotices(res.data.data);
        } catch (err) {
            console.error('Failed to load notices:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const res = await noticesApi.stats();
            setStats(res.data.data || {});
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    }, []);

    useEffect(() => { fetchNotices(); fetchStats(); }, [fetchNotices, fetchStats]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await noticesApi.sync();
            fetchNotices();
            fetchStats();
            alert(`✅ ${res.data.message || 'Notification sync completed.'}`);
        } catch (err) {
            console.error('Sync failed:', err);
            alert('❌ Portal sync failed. Check your portal credentials in settings.');
        } finally {
            setSyncing(false);
        }
    };

    const toggleSelect = (id, e) => {
        e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const statCards = [
        { label: 'Critical', value: stats.overdue || 0, icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2' },
        { label: 'Pending', value: stats.inProgress || 0, icon: Clock, color: '#d97706', bg: '#fffbeb' },
        { label: 'Resolved', value: stats.filed || 0, icon: CheckCircle, color: '#059669', bg: '#ecfdf5' },
        { label: 'Total Demand', value: '₹0', icon: Inbox, color: '#1a56db', bg: '#ebf0ff' },
    ];

    const filteredNotices = notices.filter(n => {
        if (activeFilter === 'All') return true;
        if (activeFilter === 'Critical') return n.priority === 'Critical';
        if (activeFilter === 'Pending') return !['Filed', 'Closed'].includes(n.status);
        if (activeFilter === 'Resolved') return ['Filed', 'Closed'].includes(n.status);
        return true;
    });

    return (
        <div className="notices-page">
            <div className="page-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        Notice Inbox {syncing && <Loader className="spinner" size={20} />}
                    </h1>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        Last synced: 2 hours ago from IT & GST portals
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className={`btn btn-secondary ${syncing ? 'loading' : ''}`} onClick={handleSync} disabled={syncing}>
                        <RefreshCw size={18} className={syncing ? 'spinner' : ''} />
                        {syncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowQuickScan(true)}>
                        <Plus size={18} /> Add Notice
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="notice-stats-grid">
                {statCards.map((stat, i) => (
                    <div className="notice-stat-card" key={i}>
                        <div className="notice-stat-icon" style={{ background: stat.bg }}>
                            <stat.icon size={20} style={{ color: stat.color }} />
                        </div>
                        <div>
                            <div className="notice-stat-value" style={{ color: stat.color }}>{stat.value}</div>
                            <div className="notice-stat-label">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pill Filters & Bulk Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div className="status-pills">
                    {STATUS_OPTIONS.map(opt => (
                        <button
                            key={opt}
                            className={`status-pill ${opt.toLowerCase()} ${activeFilter === opt ? 'active' : ''}`}
                            onClick={() => setActiveFilter(opt)}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
                {selectedIds.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', animation: 'fadeIn 0.2s', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, marginRight: '0.5rem' }}>
                            {selectedIds.length} selected
                        </span>
                        <button className="btn btn-ghost btn-xs" onClick={() => setSelectedIds([])}><X size={14} /> Clear</button>
                        <button
                            className="btn btn-primary btn-xs"
                            onClick={async () => {
                                if (window.confirm(`Mark ${selectedIds.length} notices as resolved?`)) {
                                    try {
                                        await Promise.all(selectedIds.map(id => noticesApi.changeStatus(id, 'Filed')));
                                        setSelectedIds([]);
                                        fetchNotices();
                                        fetchStats();
                                        alert('Successfully updated selected notices.');
                                    } catch (err) {
                                        alert('Failed to update some notices.');
                                    }
                                }
                            }}
                        >
                            <CheckCircle size={14} /> Mark as Resolved
                        </button>
                    </div>
                )}
            </div>

            {/* Notice Cards List */}
            <div className="notice-list">
                {loading ? (
                    <div className="page-loading"><Loader className="spinner" size={32} /></div>
                ) : filteredNotices.length === 0 ? (
                    <div className="empty-state">
                        <Inbox size={48} />
                        <h3>No notices found</h3>
                        <p>All clear! No pending actions for this filter.</p>
                    </div>
                ) : filteredNotices.map(notice => (
                    <div
                        key={notice._id}
                        className={`notice-row-card ${PRIORITY_COLORS[notice.priority] || 'info'}`}
                        onClick={() => setSelectedNotice(notice)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div onClick={(e) => toggleSelect(notice._id, e)}>
                                {selectedIds.includes(notice._id)
                                    ? <CheckSquare size={20} color="var(--color-primary)" />
                                    : <Square size={20} color="var(--color-border)" />
                                }
                            </div>
                            <div className="client-cell">
                                <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{notice.clientId?.name || 'Rahul Kumar'}</span>
                                <span className="client-pan" style={{ fontFamily: 'var(--font-mono)' }}>{notice.clientId?.pan}</span>
                            </div>
                        </div>
                        <div>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{notice.department}</span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{notice.section || 'Sec 143(3)'}</div>
                        </div>
                        <div>
                            <span className="ay-fy">{notice.assessmentYear || 'AY 2023-24'}</span>
                        </div>
                        <div>
                            <span style={{
                                color: notice.priority === 'Critical' ? 'var(--color-critical)' : 'inherit',
                                fontWeight: notice.priority === 'Critical' ? 700 : 500,
                                fontSize: '0.875rem'
                            }}>
                                Due {new Date(notice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <button className="btn btn-ghost">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail Drawer */}
            <NoticeDrawer
                notice={selectedNotice}
                onClose={() => setSelectedNotice(null)}
                onStatusChange={() => { fetchNotices(); fetchStats(); }}
            />

            {showQuickScan && (
                <QuickScanNotice
                    onClose={() => setShowQuickScan(false)}
                    onSaved={() => { fetchNotices(); fetchStats(); }}
                />
            )}
        </div>
    );
};

export default NoticeInbox;
