import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/endpoints';
import {
    Users, UserPlus, Search, Edit, Trash2, Key,
    X, ChevronLeft, ChevronRight, Shield, CheckCircle, XCircle
} from 'lucide-react';
import './Admin.css';

const ROLES = ['Client', 'Staff', 'Reviewer', 'Partner', 'TenantAdmin'];
const ROLE_COLORS = {
    Client: 'badge-gray', Staff: 'badge-primary', Reviewer: 'badge-warning',
    Partner: 'badge-success', TenantAdmin: 'badge-danger', SuperAdmin: 'badge-danger',
};

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showResetPw, setShowResetPw] = useState(null);
    const [stats, setStats] = useState(null);

    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (search) params.search = search;
            if (roleFilter) params.role = roleFilter;
            if (statusFilter) params.status = statusFilter;
            const res = await adminApi.listUsers(params);
            setUsers(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter, statusFilter]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await adminApi.stats();
            setStats(res.data.data);
        } catch (err) { /* ignore */ }
    }, []);

    useEffect(() => { fetchUsers(); fetchStats(); }, [fetchUsers, fetchStats]);

    const handleCreate = () => { setEditingUser(null); setShowModal(true); };
    const handleEdit = (user) => { setEditingUser(user); setShowModal(true); };

    const handleDisable = async (user) => {
        if (!window.confirm(`Disable user "${user.firstName} ${user.lastName}"?`)) return;
        try {
            await adminApi.disableUser(user._id);
            fetchUsers(pagination.page);
            fetchStats();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const handleSaved = () => {
        setShowModal(false);
        setEditingUser(null);
        fetchUsers(pagination.page);
        fetchStats();
    };

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1>User Management</h1>
                <button className="btn btn-primary" onClick={handleCreate}>
                    <UserPlus size={18} /> Add User
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="admin-stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalUsers}</div>
                        <div className="stat-label">Total Users</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--color-success)' }}>{stats.activeUsers}</div>
                        <div className="stat-label">Active</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--color-danger)' }}>{stats.disabledUsers}</div>
                        <div className="stat-label">Disabled</div>
                    </div>
                    {stats.roleBreakdown && Object.entries(stats.roleBreakdown).map(([role, count]) => (
                        <div className="stat-card" key={role}>
                            <div className="stat-value">{count}</div>
                            <div className="stat-label">{role}s</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="filter-bar" style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div className="search-input-wrap" style={{ flex: 1, minWidth: '200px' }}>
                    <Search size={16} className="search-icon" />
                    <input className="input search-input" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className="input select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ minWidth: '140px' }}>
                    <option value="">All Roles</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select className="input select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ minWidth: '130px' }}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                </select>
            </div>

            {/* Table */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Roles</th>
                            <th>Status</th>
                            <th>Last Login</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: 'auto' }}></div></td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={6}>
                                <div className="empty-state">
                                    <Users size={40} /><h3>No users found</h3>
                                </div>
                            </td></tr>
                        ) : users.map(u => (
                            <tr key={u._id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.8rem' }}>
                                            {u.firstName?.[0]}{u.lastName?.[0]}
                                        </div>
                                        <div>
                                            <strong>{u.firstName} {u.lastName}</strong>
                                            {u.designation && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.designation}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td>{u.email}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                        {u.roles?.map(r => <span key={r} className={`badge ${ROLE_COLORS[r] || 'badge-gray'}`}>{r}</span>)}
                                    </div>
                                </td>
                                <td>
                                    {u.status === 'active' ? (
                                        <span className="badge badge-success"><CheckCircle size={12} /> Active</span>
                                    ) : (
                                        <span className="badge badge-danger"><XCircle size={12} /> Disabled</span>
                                    )}
                                </td>
                                <td>
                                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(u)} title="Edit"><Edit size={15} /></button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setShowResetPw(u)} title="Reset Password"><Key size={15} /></button>
                                        {u.status === 'active' && (
                                            <button className="btn btn-ghost btn-sm" onClick={() => handleDisable(u)} title="Disable" style={{ color: 'var(--color-danger)' }}>
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {pagination.totalPages > 1 && (
                    <div className="pagination">
                        <span>Page {pagination.page} / {pagination.totalPages}</span>
                        <div className="pagination-buttons">
                            <button className="btn btn-ghost btn-sm" disabled={!pagination.hasPrev} onClick={() => fetchUsers(pagination.page - 1)}><ChevronLeft size={16} /></button>
                            <button className="btn btn-ghost btn-sm" disabled={!pagination.hasNext} onClick={() => fetchUsers(pagination.page + 1)}><ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <UserModal user={editingUser} onSaved={handleSaved} onClose={() => { setShowModal(false); setEditingUser(null); }} />
            )}

            {/* Reset Password Modal */}
            {showResetPw && (
                <ResetPasswordModal user={showResetPw} onDone={() => setShowResetPw(null)} />
            )}
        </div>
    );
};

// ── User Modal ────────────────────────────────────────
const UserModal = ({ user, onSaved, onClose }) => {
    const [form, setForm] = useState({
        email: user?.email || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        password: '',
        roles: user?.roles || ['Staff'],
        phone: user?.phone || '',
        designation: user?.designation || '',
        status: user?.status || 'active',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const toggleRole = (role) => {
        setForm(prev => {
            const roles = prev.roles.includes(role) ? prev.roles.filter(r => r !== role) : [...prev.roles, role];
            return { ...prev, roles: roles.length > 0 ? roles : prev.roles };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            if (user) {
                const { email, password, ...updateData } = form;
                await adminApi.updateUser(user._id, updateData);
            } else {
                if (!form.password) { setError('Password is required'); setSaving(false); return; }
                await adminApi.createUser(form);
            }
            onSaved();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save');
        } finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{user ? 'Edit User' : 'Create User'}</h2>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                        <div className="form-row">
                            <div className="input-group">
                                <label>First Name *</label>
                                <input className="input" name="firstName" value={form.firstName} onChange={handleChange} required />
                            </div>
                            <div className="input-group">
                                <label>Last Name *</label>
                                <input className="input" name="lastName" value={form.lastName} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="input-group" style={{ marginTop: '0.75rem' }}>
                            <label>Email *</label>
                            <input className="input" type="email" name="email" value={form.email} onChange={handleChange} required disabled={!!user} />
                        </div>

                        {!user && (
                            <div className="input-group" style={{ marginTop: '0.75rem' }}>
                                <label>Password *</label>
                                <input className="input" type="password" name="password" value={form.password} onChange={handleChange} minLength={8} />
                            </div>
                        )}

                        <div className="form-row" style={{ marginTop: '0.75rem' }}>
                            <div className="input-group">
                                <label>Phone</label>
                                <input className="input" name="phone" value={form.phone} onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label>Designation</label>
                                <input className="input" name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Senior CA" />
                            </div>
                        </div>

                        <div className="input-group" style={{ marginTop: '0.75rem' }}>
                            <label>Roles *</label>
                            <div className="role-selector">
                                {ROLES.map(role => (
                                    <button
                                        key={role}
                                        type="button"
                                        className={`role-chip ${form.roles.includes(role) ? 'role-chip-active' : ''}`}
                                        onClick={() => toggleRole(role)}
                                    >
                                        <Shield size={14} /> {role}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {user && (
                            <div className="input-group" style={{ marginTop: '0.75rem' }}>
                                <label>Status</label>
                                <select className="input select" name="status" value={form.status} onChange={handleChange}>
                                    <option value="active">Active</option>
                                    <option value="disabled">Disabled</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving && <div className="spinner"></div>}
                            {user ? 'Update' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Reset Password Modal ──────────────────────────────
const ResetPasswordModal = ({ user, onDone }) => {
    const [newPassword, setNewPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword.length < 8) { setError('Min 8 chars'); return; }
        setSaving(true); setError('');
        try {
            await adminApi.resetPassword(user._id, { newPassword });
            alert('Password reset successfully');
            onDone();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed');
        } finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={onDone}>
            <div className="modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Reset Password</h2>
                    <button className="btn btn-ghost btn-sm" onClick={onDone}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Reset password for <strong>{user.firstName} {user.lastName}</strong> ({user.email})
                        </p>
                        {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}
                        <div className="input-group">
                            <label>New Password</label>
                            <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} required autoFocus />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onDone}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving && <div className="spinner"></div>}
                            Reset Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserManagement;
