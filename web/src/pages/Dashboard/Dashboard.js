import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { noticesApi, clientsApi } from '../../api/endpoints';
import {
    Inbox, AlertTriangle, Clock, CheckCircle, FileText,
    Users, TrendingUp, Calendar, Plus, ArrowUpRight
} from 'lucide-react';
import { Box } from '@mui/material';
import DashboardStats from './DashboardStats';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({});
    const [clientCount, setClientCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [noticeRes, clientRes] = await Promise.all([
                    noticesApi.stats().catch(() => ({ data: { data: {} } })),
                    clientsApi.list({ limit: 1 }).catch(() => ({ data: { pagination: { total: 0 } } })),
                ]);
                setStats(noticeRes.data.data || {});
                setClientCount(clientRes.data.pagination?.total || 0);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const statCards = [
        { label: 'Total Notices', value: stats.total || 0, icon: Inbox, color: '#2563EB', bg: '#DBEAFE' },
        { label: 'New / Unread', value: stats.new || 0, icon: FileText, color: '#0891B2', bg: '#CFFAFE' },
        { label: 'Overdue', value: stats.overdue || 0, icon: AlertTriangle, color: '#DC2626', bg: '#FEE2E2' },
        { label: 'In Progress', value: stats.inProgress || 0, icon: Clock, color: '#D97706', bg: '#FEF3C7' },
        { label: 'Filed / Closed', value: (stats.filed || 0) + (stats.closed || 0), icon: CheckCircle, color: '#059669', bg: '#D1FAE5' },
        { label: 'Total Clients', value: clientCount, icon: Users, color: '#7C3AED', bg: '#EDE9FE' },
        { label: 'Response Drafted', value: stats.responseDrafted || 0, icon: TrendingUp, color: '#EA580C', bg: '#FFEDD5' },
        { label: 'Due This Week', value: stats.dueThisWeek || 0, icon: Calendar, color: '#0D9488', bg: '#CCFBF1' },
    ];

    if (loading) {
        return <div className="page-loading"><div className="spinner spinner-lg"></div></div>;
    }

    return (
        <div className="dashboard">
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p className="page-subtitle">Welcome back, {user?.firstName}! Here's your overview.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" onClick={() => navigate('/clients')}>
                        <Users size={18} /> Clients
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/notices')}>
                        <Inbox size={18} /> Notice Inbox
                    </button>
                </div>
            </div>

            <div className="stats-grid">
                {statCards.map((stat, i) => (
                    <div className="stat-card card-hover" key={i}>
                        <div className="stat-icon" style={{ background: stat.bg }}>
                            <stat.icon size={24} style={{ color: stat.color }} />
                        </div>
                        <div>
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-label">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 className="card-title" style={{ marginBottom: 0 }}>Quick Actions</h3>
                    </div>
                    <div className="quick-actions-grid">
                        <button className="quick-action-card" onClick={() => navigate('/clients')}>
                            <Plus size={24} style={{ color: '#7C3AED' }} />
                            <span>Add Client</span>
                        </button>
                        <button className="quick-action-card" onClick={() => navigate('/notices')}>
                            <Inbox size={24} style={{ color: '#2563EB' }} />
                            <span>Add Notice</span>
                        </button>
                        <button className="quick-action-card" onClick={() => navigate('/responses')}>
                            <FileText size={24} style={{ color: '#059669' }} />
                            <span>Draft Response</span>
                        </button>
                        <button className="quick-action-card" onClick={() => navigate('/documents')}>
                            <ArrowUpRight size={24} style={{ color: '#D97706' }} />
                            <span>Upload Document</span>
                        </button>
                    </div>
                </div>

                <div className="card">
                    <h3 className="card-title">Upcoming Deadlines</h3>
                    {(stats.dueThisWeek || 0) === 0 ? (
                        <div className="empty-state" style={{ padding: '2rem' }}>
                            <Calendar size={40} />
                            <h3>No deadlines this week</h3>
                            <p>All clear! No upcoming due dates.</p>
                        </div>
                    ) : (
                        <div className="empty-state" style={{ padding: '2rem' }}>
                            <AlertTriangle size={40} style={{ color: 'var(--color-warning)' }} />
                            <h3>{stats.dueThisWeek} notices due this week</h3>
                            <button className="btn btn-primary btn-sm" onClick={() => navigate('/notices')}>
                                View in Inbox
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <Box sx={{ mt: 4 }}>
                <DashboardStats stats={stats} />
            </Box>
        </div>
    );
};

export default Dashboard;
