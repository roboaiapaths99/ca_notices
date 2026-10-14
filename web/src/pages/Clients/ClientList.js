import React, { useState, useEffect, useCallback } from 'react';
import { clientsApi, integrationApi } from '../../api/endpoints';
import ClientOnboardingWizard from './ClientOnboardingWizard';
import { Plus, Search, Edit2, Eye, X, Building2, ChevronLeft, ChevronRight, RefreshCw, Shield } from 'lucide-react';
import './Clients.css';

const ENTITY_TYPES = ['Individual', 'HUF', 'Firm', 'LLP', 'Company', 'Trust', 'AOP/BOI', 'Other'];

const ClientList = () => {
    const [clients, setClients] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [showItPortalModal, setShowItPortalModal] = useState(false);
    const [itPortalClient, setItPortalClient] = useState(null);
    const [error, setError] = useState('');

    const fetchClients = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            const res = await clientsApi.list(params);
            setClients(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            setError('Failed to load clients');
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => { fetchClients(); }, [fetchClients]);

    const handleCreate = () => { setEditing(null); setShowModal(true); };
    const handleEdit = (client) => { setEditing(client); setShowModal(true); };

    const handleSave = async (data) => {
        try {
            if (editing) {
                await clientsApi.update(editing._id, data);
            } else {
                await clientsApi.create(data);
            }
            setShowModal(false);
            fetchClients(pagination.page);
        } catch (err) {
            throw err;
        }
    };

    const handleSync = async (client, type) => {
        try {
            setLoading(true);
            let res;
            if (type === 'ITD') {
                res = await integrationApi.syncItd({ pan: client.pan, clientId: client._id });
            } else {
                // GST sync (assuming first GSTIN for simplicity or we could show a picker)
                const gstin = client.gstins?.[0]?.gstin;
                if (!gstin) {
                    alert('No GSTIN found for this client');
                    setLoading(false);
                    return;
                }
                res = await integrationApi.syncGstn({ gstin, clientId: client._id });
            }
            alert(res.data.message || 'Sync successful');
            fetchClients(pagination.page);
        } catch (err) {
            alert(err.response?.data?.message || `Failed to sync ${type}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="clients-page">
            <div className="page-header">
                <h1>Clients</h1>
                <button className="btn btn-primary" onClick={handleCreate}>
                    <Plus size={18} /> Add Client
                </button>
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <div className="search-input-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                        className="input search-input"
                        placeholder="Search by name or PAN..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select className="input select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {error && <div className="login-error">{error}</div>}

            {/* Table */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Entity Type</th>
                            <th>PAN</th>
                            <th>GSTINs</th>
                            <th>Contacts</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: 'auto' }}></div></td></tr>
                        ) : clients.length === 0 ? (
                            <tr><td colSpan={7}>
                                <div className="empty-state">
                                    <Building2 size={40} />
                                    <h3>No clients found</h3>
                                    <p>Create your first client to get started.</p>
                                </div>
                            </td></tr>
                        ) : clients.map(client => (
                            <tr key={client._id}>
                                <td><strong>{client.name}</strong></td>
                                <td><span className="badge badge-gray">{client.entityType}</span></td>
                                <td style={{ fontFamily: 'monospace' }}>{client.pan || '—'}</td>
                                <td>{client.gstins?.length || 0}</td>
                                <td>{client.contacts?.length || 0}</td>
                                <td>
                                    <span className={`badge ${client.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                                        {client.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleSync(client, 'ITD')} title="Sync Income Tax">
                                            <RefreshCw size={15} style={{ color: '#10b981' }} />
                                        </button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleSync(client, 'GST')} title="Sync GST">
                                            <RefreshCw size={15} style={{ color: '#3b82f6' }} />
                                        </button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(client)} title="Edit">
                                            <Edit2 size={15} />
                                        </button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => { setItPortalClient(client); setShowItPortalModal(true); }} title="IT Portal Config">
                                            <Shield size={15} style={{ color: '#8b5cf6' }} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="pagination">
                        <span>Showing {clients.length} of {pagination.total} clients</span>
                        <div className="pagination-buttons">
                            <button className="btn btn-ghost btn-sm" disabled={!pagination.hasPrev} onClick={() => fetchClients(pagination.page - 1)}>
                                <ChevronLeft size={16} /> Prev
                            </button>
                            <span style={{ padding: '0 8px', fontSize: '0.875rem' }}>Page {pagination.page} of {pagination.totalPages}</span>
                            <button className="btn btn-ghost btn-sm" disabled={!pagination.hasNext} onClick={() => fetchClients(pagination.page + 1)}>
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                editing ? (
                    <ClientModal
                        client={editing}
                        onSave={handleSave}
                        onClose={() => setShowModal(false)}
                    />
                ) : (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" style={{ maxWidth: '700px', padding: 0 }} onClick={e => e.stopPropagation()}>
                            <ClientOnboardingWizard onComplete={() => { setShowModal(false); fetchClients(); }} />
                        </div>
                    </div>
                )
            )}

            {/* IT Portal Credentials Modal */}
            {showItPortalModal && (
                <ItPortalCredentialsModal
                    client={itPortalClient}
                    onClose={() => { setShowItPortalModal(false); setItPortalClient(null); }}
                    onSave={() => { setShowItPortalModal(false); setItPortalClient(null); fetchClients(); }}
                />
            )}
        </div>
    );
};

// ── IT Portal Credentials Modal ─────────────────────────
const ItPortalCredentialsModal = ({ client, onClose, onSave }) => {
    const [username, setUsername] = useState(client?.itPortal?.username || '');
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await clientsApi.updateItPortalCredentials(client._id, { username, password });
            onSave();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save credentials');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>IT Portal Config: {client.name}</h2>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            These credentials will be encrypted (AES-256) and used only for automated notice fetching.
                        </p>
                        {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}
                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label>Username (PAN/ID)</label>
                            <input className="input" value={username} onChange={e => setUsername(e.target.value)} required placeholder="Enter username" />
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter password" />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving && <div className="spinner"></div>}
                            Save & Encrypt
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Client Create/Edit Modal ────────────────────────────
const ClientModal = ({ client, onSave, onClose }) => {
    const [form, setForm] = useState({
        name: client?.name || '',
        entityType: client?.entityType || 'Individual',
        pan: client?.pan || '',
        tan: client?.tan || '',
        status: client?.status || 'active',
        notes: client?.notes || '',
        contacts: client?.contacts || [{ name: '', email: '', phone: '', designation: '' }],
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleContactChange = (index, field, value) => {
        const updated = [...form.contacts];
        updated[index] = { ...updated[index], [field]: value };
        setForm({ ...form, contacts: updated });
    };

    const addContact = () => {
        setForm({ ...form, contacts: [...form.contacts, { name: '', email: '', phone: '', designation: '' }] });
    };

    const removeContact = (index) => {
        setForm({ ...form, contacts: form.contacts.filter((_, i) => i !== index) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await onSave(form);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save client');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{client ? 'Edit Client' : 'Add New Client'}</h2>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <div className="input-group">
                                <label>Client Name *</label>
                                <input className="input" name="name" value={form.name} onChange={handleChange} required placeholder="Enter client name" />
                            </div>
                            <div className="input-group">
                                <label>Entity Type</label>
                                <select className="input select" name="entityType" value={form.entityType} onChange={handleChange}>
                                    {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-row" style={{ marginBottom: '1rem' }}>
                            <div className="input-group">
                                <label>PAN</label>
                                <input className="input" name="pan" value={form.pan} onChange={handleChange} placeholder="ABCDE1234F" maxLength={10} style={{ textTransform: 'uppercase' }} />
                            </div>
                            <div className="input-group">
                                <label>TAN</label>
                                <input className="input" name="tan" value={form.tan} onChange={handleChange} placeholder="ABCD12345E" maxLength={10} style={{ textTransform: 'uppercase' }} />
                            </div>
                        </div>

                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label>Status</label>
                            <select className="input select" name="status" value={form.status} onChange={handleChange}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Contacts */}
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Contacts</label>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={addContact}><Plus size={14} /> Add</button>
                            </div>
                            {form.contacts.map((c, i) => (
                                <div key={i} className="contact-row">
                                    <input className="input" placeholder="Name" value={c.name} onChange={e => handleContactChange(i, 'name', e.target.value)} />
                                    <input className="input" placeholder="Email" type="email" value={c.email} onChange={e => handleContactChange(i, 'email', e.target.value)} />
                                    <input className="input" placeholder="Phone" value={c.phone} onChange={e => handleContactChange(i, 'phone', e.target.value)} />
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeContact(i)}><X size={14} /></button>
                                </div>
                            ))}
                        </div>

                        <div className="input-group">
                            <label>Notes</label>
                            <textarea className="input" name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Optional notes..." />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving && <div className="spinner"></div>}
                            {client ? 'Update Client' : 'Create Client'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientList;
