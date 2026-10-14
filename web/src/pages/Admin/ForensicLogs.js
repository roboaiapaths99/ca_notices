import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/endpoints';
import {
    Activity, Search, Filter, Calendar, 
    ChevronLeft, ChevronRight, Eye, User, Shield, Terminal
} from 'lucide-react';
import './Admin.css';

const ACTION_COLORS = {
    // Notices
    NOTICE_CREATED: 'badge-success',
    NOTICE_UPDATED: 'badge-primary',
    NOTICE_DELETED: 'badge-danger',
    NOTICE_STATUS_CHANGE: 'badge-warning',
    NOTICE_ASSIGN: 'badge-info',
    
    // Responses
    RESPONSE_CREATED: 'badge-success',
    RESPONSE_UPDATED: 'badge-primary',
    RESPONSE_DELETED: 'badge-danger',
    RESPONSE_APPROVED: 'badge-success',
    
    // Users
    USER_CREATE: 'badge-success',
    USER_UPDATE: 'badge-primary',
    USER_DISABLE: 'badge-danger',
    USER_PASSWORD_RESET: 'badge-warning',
    
    // Admin
    TENANT_SETTINGS_UPDATE: 'badge-danger',
};

const ForensicLogs = () => {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [filters, setFilters] = useState({
        actorEmail: '',
        action: '',
        entityType: '',
        startDate: '',
        endDate: ''
    });
    
    const [selectedLog, setSelectedLog] = useState(null);

    const fetchLogs = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 25, ...filters };
            // Remove empty strings
            Object.keys(params).forEach(key => !params[key] && delete params[key]);
            
            const res = await adminApi.listAuditLogs(params);
            setLogs(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Failed to load audit logs:', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(() => fetchLogs(1), 500); // Debounce
        return () => clearTimeout(timer);
    }, [fetchLogs]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="admin-page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="icon-box" style={{ background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '8px' }}>
                        <Activity size={24} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                        <h1>Forensic Audit Trail</h1>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Immutable record of all system mutations</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-bar" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div className="search-input-wrap">
                    <User size={16} className="search-icon" />
                    <input 
                        name="actorEmail"
                        className="input search-input" 
                        placeholder="Filter by Actor Email..." 
                        value={filters.actorEmail} 
                        onChange={handleFilterChange} 
                    />
                </div>
                
                <select name="action" className="input select" value={filters.action} onChange={handleFilterChange}>
                    <option value="">All Actions</option>
                    <optgroup label="Notices">
                        <option value="NOTICE_CREATED">Notice Created</option>
                        <option value="NOTICE_UPDATED">Notice Updated</option>
                        <option value="NOTICE_DELETED">Notice Deleted</option>
                    </optgroup>
                    <optgroup label="Responses">
                        <option value="RESPONSE_CREATED">Response Created</option>
                        <option value="RESPONSE_UPDATED">Response Updated</option>
                        <option value="RESPONSE_APPROVED">Response Approved</option>
                    </optgroup>
                    <optgroup label="Security">
                        <option value="USER_CREATE">User Created</option>
                        <option value="USER_UPDATE">User Updated</option>
                        <option value="USER_PASSWORD_RESET">Password Reset</option>
                        <option value="TENANT_SETTINGS_UPDATE">Settings Changed</option>
                    </optgroup>
                </select>

                <div className="search-input-wrap">
                    <Calendar size={16} className="search-icon" />
                    <input 
                        type="date"
                        name="startDate"
                        className="input search-input" 
                        value={filters.startDate} 
                        onChange={handleFilterChange} 
                        title="Start Date"
                    />
                </div>

                <div className="search-input-wrap">
                    <Calendar size={16} className="search-icon" />
                    <input 
                        type="date"
                        name="endDate"
                        className="input search-input" 
                        value={filters.endDate} 
                        onChange={handleFilterChange} 
                        title="End Date"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Actor</th>
                            <th>Action</th>
                            <th>Entity</th>
                            <th>IP Address</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && logs.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: 'auto' }}></div></td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={6}>
                                <div className="empty-state">
                                    <Terminal size={40} />
                                    <h3>No audit logs found</h3>
                                    <p>Try adjusting your filters</p>
                                </div>
                            </td></tr>
                        ) : logs.map(log => (
                            <tr key={log._id}>
                                <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                    {formatDate(log.createdAt)}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.actorEmail}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {log.actorId}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${ACTION_COLORS[log.action] || 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                                        {log.action}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.85rem' }}>{log.entityType}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.entityId}</span>
                                    </div>
                                </td>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                    {log.ipAddress || 'Internal'}
                                </td>
                                <td>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedLog(log)}>
                                        <Eye size={16} /> Inspect
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {pagination.totalPages > 1 && (
                    <div className="pagination">
                        <span>Showing {logs.length} of {pagination.total} logs</span>
                        <div className="pagination-buttons">
                            <button className="btn btn-ghost btn-sm" disabled={!pagination.hasPrev} onClick={() => fetchLogs(pagination.page - 1)}><ChevronLeft size={16} /></button>
                            <span>Page {pagination.page} / {pagination.totalPages}</span>
                            <button className="btn btn-ghost btn-sm" disabled={!pagination.hasNext} onClick={() => fetchLogs(pagination.page + 1)}><ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Log Detail Modal */}
            {selectedLog && (
                <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
                    <div className="modal" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Log Details</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedLog(null)}><ChevronLeft size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="log-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="detail-item">
                                    <label>Action</label>
                                    <div className={`badge ${ACTION_COLORS[selectedLog.action] || 'badge-gray'}`}>{selectedLog.action}</div>
                                </div>
                                <div className="detail-item">
                                    <label>Timestamp</label>
                                    <div>{formatDate(selectedLog.createdAt)}</div>
                                </div>
                                <div className="detail-item">
                                    <label>Actor</label>
                                    <div>{selectedLog.actorEmail}</div>
                                </div>
                                <div className="detail-item">
                                    <label>IP Address</label>
                                    <div style={{ fontFamily: 'monospace' }}>{selectedLog.ipAddress || 'N/A'}</div>
                                </div>
                                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                                    <label>User Agent</label>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-body)', padding: '0.5rem', borderRadius: '4px' }}>
                                        {selectedLog.userAgent || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            <label>Metadata / Changes</label>
                            <pre style={{ 
                                background: '#1a1a2e', 
                                color: '#00d4ff', 
                                padding: '1rem', 
                                borderRadius: '8px', 
                                overflowX: 'auto',
                                fontSize: '0.85rem'
                            }}>
                                {JSON.stringify(selectedLog.metadata, null, 2)}
                            </pre>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setSelectedLog(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ForensicLogs;
