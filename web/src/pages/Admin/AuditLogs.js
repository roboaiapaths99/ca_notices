import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/endpoints';
import { Search, Filter, Clock, User, Shield, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: '',
        entityType: ''
    });

    useEffect(() => {
        fetchLogs();
    }, [pagination.page, filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await adminApi.listAuditLogs({
                page: pagination.page,
                limit: 50,
                ...filters
            });
            setLogs(response.data);
            setPagination(prev => ({
                ...prev,
                totalPages: response.pagination.totalPages,
                total: response.pagination.total
            }));
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action) => {
        if (action.includes('DELETE')) return '#ef4444';
        if (action.includes('CREATE')) return '#10b981';
        if (action.includes('UPDATE')) return '#f59e0b';
        if (action.includes('AUTH')) return '#3b82f6';
        return '#6b7280';
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="header-title">
                    <Shield size={24} style={{ color: 'var(--primary)' }} />
                    <h1>Forensic Audit Trail</h1>
                </div>
                <div className="header-actions">
                    <div className="search-box">
                        <Filter size={18} />
                        <select 
                            className="input" 
                            style={{ border: 'none', background: 'transparent', outline: 'none' }}
                            value={filters.entityType}
                            onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                        >
                            <option value="">All Entities</option>
                            <option value="Notice">Notice</option>
                            <option value="Client">Client</option>
                            <option value="User">User</option>
                            <option value="Document">Document</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm" style={{ padding: 0 }}>
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Actor</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>Metadata</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                        <div className="spinner"></div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                        No audit logs found.
                                    </td>
                                </tr>
                            ) : logs.map((log) => (
                                <tr key={log._id}>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 500 }}>{format(new Date(log.createdAt), 'dd MMM yyyy')}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{format(new Date(log.createdAt), 'HH:mm:ss')}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className="avatar-small">
                                                <User size={14} />
                                            </div>
                                            <span>{log.actorEmail}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge" style={{ 
                                            backgroundColor: `${getActionColor(log.action)}15`, 
                                            color: getActionColor(log.action),
                                            border: `1px solid ${getActionColor(log.action)}30`
                                        }}>
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '0.875rem' }}>{log.entityType}</span>
                                        {log.entityId && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ID: ...{log.entityId.slice(-6)}</div>}
                                    </td>
                                    <td>
                                        <button className="btn btn-ghost btn-sm" title="View Details">
                                            <Info size={14} />
                                        </button>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{log.ipAddress || 'Internal'}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pagination">
                    <span>Total {pagination.total || 0} entries</span>
                    <div className="pagination-buttons">
                        <button 
                            className="btn btn-ghost btn-sm" 
                            disabled={pagination.page <= 1}
                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                        >
                            <ChevronLeft size={16} /> Prev
                        </button>
                        <span>Page {pagination.page} of {pagination.totalPages}</span>
                        <button 
                            className="btn btn-ghost btn-sm" 
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .avatar-small {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: var(--bg-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .badge {
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }
            `}</style>
        </div>
    );
};

export default AuditLogs;
