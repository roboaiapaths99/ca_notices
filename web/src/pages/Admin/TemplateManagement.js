import React, { useState, useEffect, useCallback } from 'react';
import { templatesApi } from '../../api/endpoints';
import {
    FileText, Plus, Search, Edit, Trash2,
    X, ChevronLeft, ChevronRight, Hash, Tag
} from 'lucide-react';
import '../Admin/Admin.css';

const DEPARTMENTS = ['IncomeTax', 'GST', 'TDS', 'CustomsDuty', 'Other', 'General'];

const TemplateManagement = () => {
    const [templates, setTemplates] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    const fetchTemplates = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 10 };
            if (search) params.search = search;
            if (deptFilter) params.department = deptFilter;
            const res = await templatesApi.list(params);
            setTemplates(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Failed to load templates:', err);
        } finally {
            setLoading(false);
        }
    }, [search, deptFilter]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    const handleCreate = () => {
        setEditingTemplate(null);
        setShowModal(true);
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await templatesApi.remove(id);
            fetchTemplates(pagination.page);
        } catch (err) {
            alert('Failed to delete template');
        }
    };

    const handleSaved = () => {
        setShowModal(false);
        setEditingTemplate(null);
        fetchTemplates(pagination.page);
    };

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1>Response Templates</h1>
                <button className="btn btn-primary" onClick={handleCreate}>
                    <Plus size={18} /> Create Template
                </button>
            </div>

            <div className="filter-bar" style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem' }}>
                <div className="search-input-wrap" style={{ flex: 1 }}>
                    <Search size={16} className="search-icon" />
                    <input
                        className="input search-input"
                        placeholder="Search templates by name or subject..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="input select"
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    style={{ width: '200px' }}
                >
                    <option value="">All Departments</option>
                    {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Subject</th>
                            <th>Placeholders</th>
                            <th>Last Updated</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: 'auto' }}></div></td></tr>
                        ) : templates.length === 0 ? (
                            <tr><td colSpan={6}><div className="empty-state"><FileText size={40} /><h3>No templates found</h3></div></td></tr>
                        ) : templates.map(t => (
                            <tr key={t._id}>
                                <td><strong>{t.name}</strong></td>
                                <td><span className="badge badge-primary">{t.department}</span></td>
                                <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                        {t.placeholders?.map(p => (
                                            <span key={p} className="badge badge-gray" style={{ fontSize: '10px' }}>{p}</span>
                                        ))}
                                    </div>
                                </td>
                                <td>{new Date(t.updatedAt).toLocaleDateString()}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(t)}><Edit size={15} /></button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(t._id)} style={{ color: 'var(--color-danger)' }}><Trash2 size={15} /></button>
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
                            <button className="btn btn-ghost btn-sm" disabled={!pagination.hasPrev} onClick={() => fetchTemplates(pagination.page - 1)}><ChevronLeft size={16} /></button>
                            <button className="btn btn-ghost btn-sm" disabled={!pagination.hasNext} onClick={() => fetchTemplates(pagination.page + 1)}><ChevronRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            {showModal && (
                <TemplateModal
                    template={editingTemplate}
                    onSaved={handleSaved}
                    onClose={() => { setShowModal(false); setEditingTemplate(null); }}
                />
            )}
        </div>
    );
};

const TemplateModal = ({ template, onSaved, onClose }) => {
    const [form, setForm] = useState({
        name: template?.name || '',
        department: template?.department || 'General',
        subject: template?.subject || '',
        bodyHtml: template?.bodyHtml || '',
        placeholders: template?.placeholders || []
    });
    const [saving, setSaving] = useState(false);
    const [placeholderInput, setPlaceholderInput] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (template) {
                await templatesApi.update(template._id, form);
            } else {
                await templatesApi.create(form);
            }
            onSaved();
        } catch (err) {
            alert('Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    const addPlaceholder = () => {
        if (!placeholderInput) return;
        if (!form.placeholders.includes(placeholderInput)) {
            setForm(prev => ({ ...prev, placeholders: [...prev.placeholders, placeholderInput] }));
        }
        setPlaceholderInput('');
    };

    const removePlaceholder = (p) => {
        setForm(prev => ({ ...prev, placeholders: prev.placeholders.filter(item => item !== p) }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{template ? 'Edit Template' : 'Create Template'}</h2>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
                        <div className="main-form">
                            <div className="input-group">
                                <label>Template Name *</label>
                                <input
                                    className="input"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                    placeholder="e.g. Scrutiny Response - Sec 143(3)"
                                />
                            </div>
                            <div className="form-row" style={{ marginTop: '0.75rem' }}>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label>Department</label>
                                    <select
                                        className="input select"
                                        value={form.department}
                                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                                    >
                                        {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="input-group" style={{ marginTop: '0.75rem' }}>
                                <label>Email/Letter Subject *</label>
                                <input
                                    className="input"
                                    value={form.subject}
                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                    required
                                    placeholder="In response to notice ref..."
                                />
                            </div>
                            <div className="input-group" style={{ marginTop: '0.75rem' }}>
                                <label>Body Content (HTML) *</label>
                                <textarea
                                    className="input"
                                    rows={12}
                                    value={form.bodyHtml}
                                    onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
                                    required
                                    style={{ fontFamily: 'monospace', fontSize: '13px' }}
                                    placeholder="Dear Sir/Madam, <br/><br/> In reference to notice regarding {{clientName}}..."
                                />
                            </div>
                        </div>

                        <div className="side-panel">
                            <div className="card" style={{ background: 'var(--bg-secondary)', padding: '1rem' }}>
                                <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Hash size={16} /> Placeholders
                                </h4>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                    Use these in your body like <code>{"{{placeholder}}"}</code>
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <input
                                        className="input"
                                        value={placeholderInput}
                                        onChange={(e) => setPlaceholderInput(e.target.value)}
                                        placeholder="e.g. assesseeName"
                                        style={{ height: '32px', fontSize: '13px' }}
                                    />
                                    <button type="button" className="btn btn-primary btn-sm" onClick={addPlaceholder}>Add</button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {form.placeholders.map(p => (
                                        <span key={p} className="badge badge-gray" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {p} <X size={10} style={{ cursor: 'pointer' }} onClick={() => removePlaceholder(p)} />
                                        </span>
                                    ))}
                                    {form.placeholders.length === 0 && (
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No placeholders added</span>
                                    )}
                                </div>

                                <div style={{ marginTop: '1.5rem' }}>
                                    <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Tag size={16} /> Suggestions
                                    </h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {['clientName', 'panNumber', 'assessmentYear', 'noticeDate', 'officerName'].map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                className="btn btn-ghost btn-sm"
                                                style={{ fontSize: '11px', padding: '2px 6px' }}
                                                onClick={() => !form.placeholders.includes(s) && setForm(prev => ({ ...prev, placeholders: [...prev.placeholders, s] }))}
                                            >
                                                +{s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving && <div className="spinner"></div>}
                            {template ? 'Update Template' : 'Create Template'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TemplateManagement;
