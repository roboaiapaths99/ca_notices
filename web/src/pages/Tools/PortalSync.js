import React, { useState, useEffect } from 'react';
import {
    RefreshCw, Shield, AlertCircle, CheckCircle, ExternalLink,
    Lock, User as UserIcon, Calendar, Search, Filter, Loader,
    Clock, X
} from 'lucide-react';
import { clientsApi, noticesApi } from '../../api/endpoints';
import { toast } from 'react-hot-toast';
import './Automation.css';

const PortalSync = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncingAll, setSyncingAll] = useState(false);
    const [syncingClient, setSyncingClient] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCredsModal, setShowCredsModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [creds, setCreds] = useState({ username: '', password: '' });

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await clientsApi.list({ limit: 100 });
            // For this UI, we only show clients that could have portal creds
            setClients(res.data.data);
        } catch (err) {
            toast.error('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleSyncAll = async () => {
        setSyncingAll(true);
        try {
            const res = await noticesApi.sync();
            toast.success(res.data.message);
            fetchClients();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Sync failed');
        } finally {
            setSyncingAll(false);
        }
    };

    const handleSyncClient = async (clientId) => {
        setSyncingClient(clientId);
        try {
            const res = await noticesApi.sync({ clientId });
            toast.success(res.data.message);
            fetchClients();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Client sync failed');
        } finally {
            setSyncingClient(null);
        }
    };

    const handleUpdateCreds = async (e) => {
        e.preventDefault();
        try {
            await clientsApi.updateItPortalCredentials(selectedClient._id, creds);
            toast.success('Credentials updated securely');
            setShowCredsModal(false);
            setCreds({ username: '', password: '' });
            fetchClients();
        } catch (err) {
            toast.error('Failed to update credentials');
        }
    };

    const openCredsModal = (client) => {
        setSelectedClient(client);
        setCreds({
            username: client.itPortal?.username || '',
            password: '' // Never show existing password
        });
        setShowCredsModal(true);
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.pan?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Connected': return 'text-success';
            case 'Invalid Credentials': return 'text-critical';
            case 'Pending': return 'text-warning';
            default: return 'text-muted';
        }
    };

    return (
        <div className="automation-page">
            <div className="page-header">
                <div>
                    <h1>Automated Portal Sync (RPA)</h1>
                    <p className="text-muted">Manage Income Tax portal synchronization across all clients.</p>
                </div>
                <button
                    className={`btn btn-primary ${syncingAll ? 'loading' : ''}`}
                    onClick={handleSyncAll}
                    disabled={syncingAll || loading}
                >
                    <RefreshCw size={18} className={syncingAll ? 'spinner' : ''} />
                    {syncingAll ? 'Syncing All...' : 'Run Global Sync'}
                </button>
            </div>

            <div className="automation-grid">
                {/* Stats Section */}
                <div className="automation-stats">
                    <div className="stat-mini-card">
                        <span className="stat-mini-label">Connected Portals</span>
                        <span className="stat-mini-value">{clients.filter(c => c.itPortal?.status === 'Connected').length}</span>
                    </div>
                    <div className="stat-mini-card">
                        <span className="stat-mini-label">Pending/Failed</span>
                        <span className="stat-mini-value">{clients.filter(c => ['Pending', 'Invalid Credentials'].includes(c.itPortal?.status)).length}</span>
                    </div>
                    <div className="stat-mini-card">
                        <span className="stat-mini-label">Total Clients</span>
                        <span className="stat-mini-value">{clients.length}</span>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="filter-bar">
                    <div className="search-input-wrapper">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search by client name or PAN..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Clients Table */}
                <div className="automation-table-card">
                    <table className="automation-table">
                        <thead>
                            <tr>
                                <th>Client Details</th>
                                <th>ITD Login</th>
                                <th>Sync Status</th>
                                <th>Last Sync</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8">
                                        <Loader className="spinner mx-auto" size={32} />
                                    </td>
                                </tr>
                            ) : filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-muted">
                                        No clients found matching your search.
                                    </td>
                                </tr>
                            ) : filteredClients.map(client => (
                                <tr key={client._id}>
                                    <td>
                                        <div className="client-info">
                                            <span className="client-name">{client.name}</span>
                                            <span className="client-sub">{client.pan} • {client.entityType}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {client.itPortal?.username ? (
                                            <div className="login-id">
                                                <UserIcon size={14} />
                                                <span>{client.itPortal.username}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted italic text-xs">Not Configured</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className={`status-pill-mini ${getStatusColor(client.itPortal?.status)}`}>
                                            {client.itPortal?.status === 'Connected' && <CheckCircle size={14} />}
                                            {client.itPortal?.status === 'Invalid Credentials' && <AlertCircle size={14} />}
                                            {client.itPortal?.status === 'Pending' && <Clock size={14} />}
                                            <span>{client.itPortal?.status || 'Disconnected'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="sync-time">
                                            <Calendar size={14} />
                                            <span>{client.itPortal?.lastSync ? new Date(client.itPortal.lastSync).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <div className="action-btns">
                                            <button
                                                className="btn-icon"
                                                title="Update Credentials"
                                                onClick={() => openCredsModal(client)}
                                            >
                                                <Shield size={16} />
                                            </button>
                                            <button
                                                className="btn-icon"
                                                title="Trigger Sync"
                                                disabled={!client.itPortal?.username || syncingClient === client._id}
                                                onClick={() => handleSyncClient(client._id)}
                                            >
                                                <RefreshCw size={16} className={syncingClient === client._id ? 'spinner' : ''} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Credentials Modal */}
            {showCredsModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>IT Portal Credentials</h2>
                            <button className="btn-close" onClick={() => setShowCredsModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateCreds}>
                            <div className="modal-body">
                                <div className="alert alert-info py-2 mb-4 text-xs">
                                    <Lock size={14} className="inline mr-1" />
                                    Your credentials are encrypted using AES-256 and stored securely.
                                </div>
                                <div className="form-group">
                                    <label>Portal Username (PAN)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        required
                                        value={creds.username}
                                        onChange={(e) => setCreds({ ...creds, username: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Portal Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        required
                                        placeholder="••••••••"
                                        value={creds.password}
                                        onChange={(e) => setCreds({ ...creds, password: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCredsModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save & Verify</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortalSync;
