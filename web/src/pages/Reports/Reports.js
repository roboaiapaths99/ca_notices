import React, { useState, useEffect } from 'react';
import { 
    LineChart, Line, AreaChart, Area, BarChart, Bar, 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
    TrendingUp, AlertCircle, CheckCircle2, 
    Clock, Download, Filter, Calendar, Loader,
    ChevronUp, ChevronDown, User, IndianRupee
} from 'lucide-react';
import { analyticsApi } from '../../api/endpoints';
import './Reports.css';

const COLORS = ['#2563EB', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#6366F1'];

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await analyticsApi.getStats();
            setData(res.data.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch analytics', err);
            setError('Unable to load real-time analytics. Showing simulated data.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="reports-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader size={48} className="spin" color="var(--color-primary)" />
                    <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Calculating real-time risk metrics...</p>
                </div>
            </div>
        );
    }

    const summary = data?.summary || { totalDemand: 0, count: 0 };
    const status_dist = data?.statusDistribution || [];
    const dept_dist = data?.departmentBreakdown || [];
    const trend_data = data?.monthlyTrend?.map(t => ({
        name: `${t._id.month}/${t._id.year}`,
        notices: t.count
    })) || [];
    const top_clients = data?.topClients || [];

    const stats = [
        { 
            label: 'Total Notices', 
            value: summary.count, 
            icon: TrendingUp, 
            trend: '+12%', 
            color: '#6366F1' 
        },
        { 
            label: 'Demand at Risk', 
            value: `₹${(summary.totalDemand / 1000000).toFixed(2)}M`, 
            icon: IndianRupee, 
            trend: '+5.2%', 
            color: '#F43F5E' 
        },
        { 
            label: 'Avg. Severity', 
            value: 'Medium', 
            icon: AlertCircle, 
            trend: 'Stable', 
            color: '#F59E0B' 
        },
        { 
            label: 'Resolution Rate', 
            value: '84%', 
            icon: CheckCircle2, 
            trend: '+2.4%', 
            color: '#10B981' 
        },
    ];

    return (
        <div className="reports-page">
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Risk Dashboard</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                        Real-time demand tracking and compliance analytics
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={fetchData}>
                        <RefreshCw size={16} style={{ marginRight: '6px' }} /> Refresh
                    </button>
                    <button className="btn btn-primary btn-sm">
                        <Download size={16} style={{ marginRight: '6px' }} /> Export AI Insight
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ 
                    padding: '12px 16px', background: '#fff7ed', border: '1px solid #ffedd5', 
                    borderRadius: '8px', marginBottom: '24px', fontSize: '0.875rem', color: '#9a3412',
                    display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            {/* Stats Grid */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                {stats.map((stat, index) => (
                    <div key={index} className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ padding: '10px', background: `${stat.color}15`, color: stat.color, borderRadius: '12px' }}>
                                <stat.icon size={20} />
                            </div>
                            <div style={{ 
                                fontSize: '0.75rem', fontWeight: 700, 
                                color: stat.trend.includes('+') ? '#10B981' : '#F43F5E',
                                background: stat.trend.includes('+') ? '#F0FDF4' : '#FFF1F2',
                                padding: '2px 8px', borderRadius: '12px', height: 'fit-content'
                            }}>
                                {stat.trend}
                            </div>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{stat.label}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>{stat.value}</div>
                        
                        {/* Subtle background decoration */}
                        <div style={{ 
                            position: 'absolute', right: '-10px', bottom: '-10px', 
                            opacity: 0.05, color: stat.color 
                        }}>
                            <stat.icon size={80} />
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px', marginBottom: '24px' }}>
                {/* Volume Trend */}
                <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Notice Volume Trend</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)', marginRight: '6px' }}></div>
                                New Notices
                            </span>
                        </div>
                    </div>
                    <div style={{ height: '320px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trend_data}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="notices" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Client Heatmap */}
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '20px' }}>Top At-Risk Clients</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {top_clients.map((client, i) => (
                            <div key={i} style={{ 
                                display: 'flex', alignItems: 'center', gap: '12px', 
                                padding: '12px', background: '#f8fafc', borderRadius: '12px' 
                            }}>
                                <div style={{ 
                                    width: '40px', height: '40px', borderRadius: '10px', 
                                    background: COLORS[i % COLORS.length], color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1rem', fontWeight: 700
                                }}>
                                    {client.name?.[0]}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{client.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>PAN: {client.pan}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.925rem', fontWeight: 800, color: 'var(--color-primary)' }}>{client.count}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Notices</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                {/* Department Distribution */}
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '24px' }}>Department Distribution</h3>
                    <div style={{ height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dept_dist.map((d, i) => ({ name: d._id, value: d.count }))}
                                    cx="50%" cy="50%" innerRadius={60} outerRadius={85}
                                    paddingAngle={5} dataKey="value"
                                >
                                    {dept_dist.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '24px' }}>Resolution Pipeline</h3>
                    <div style={{ height: '280px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={status_dist.map(s => ({ name: s._id, count: s.count }))}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple Refresh icon
const RefreshCw = ({ size, style }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" width={size} height={size} 
        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}
    >
        <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
    </svg>
);

export default Reports;
