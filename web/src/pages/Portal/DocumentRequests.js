import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Send, FileCheck, Clock, AlertTriangle,
    Copy, ExternalLink, Plus, X, Loader, CheckCircle
} from 'lucide-react';
import { documentRequestsApi, clientsApi, noticesApi } from '../../api/endpoints';

const DocumentRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    // Create form state 
    const [notices, setNotices] = useState([]);
    const [clients, setClients] = useState([]);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({
        noticeId: '', clientId: '', clientEmail: '', message: '',
        docs: [{ label: '', description: '', required: true }]
    });

    const location = useLocation();

    useEffect(() => {
        fetchRequests();
        
        // Handle incoming state from NoticeDrawer (One-Click Request)
        if (location.state?.noticeId && location.state?.clientId) {
            handleQuickRequest(location.state);
        }
    }, [location.state]);

    const handleQuickRequest = async (state) => {
        await openCreateModal();
        setForm(prev => ({
            ...prev,
            noticeId: state.noticeId,
            clientId: state.clientId,
            docs: state.docs?.length > 0 
                ? state.docs.map(d => ({ label: d, description: '', required: true }))
                : [{ label: '', description: '', required: true }]
        }));
    };

    const fetchRequests = async () => {
        try {
            const res = await documentRequestsApi.list();
            setRequests(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch document requests', err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = async () => {
        setShowCreate(true);
        try {
            const [noticeRes, clientRes] = await Promise.all([
                noticesApi.list({ limit: 50 }),
                clientsApi.list({ limit: 100 })
            ]);
            setNotices(noticeRes.data.data || []);
            setClients(clientRes.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async () => {
        if (!form.noticeId || !form.clientId || form.docs.filter(d => d.label).length === 0) return;
        setCreating(true);
        try {
            const res = await documentRequestsApi.create({
                noticeId: form.noticeId,
                clientId: form.clientId,
                clientEmail: form.clientEmail,
                message: form.message,
                requestedDocs: form.docs.filter(d => d.label)
            });
            const newReq = res.data.data;
            await fetchRequests();
            setShowCreate(false);
            setForm({ noticeId: '', clientId: '', clientEmail: '', message: '', docs: [{ label: '', description: '', required: true }] });
            // Copy link
            copyLink(newReq.portalUrl);
        } catch (err) {
            console.error(err);
        } finally {
            setCreating(false);
        }
    };

    const addDocRow = () => {
        setForm(prev => ({ ...prev, docs: [...prev.docs, { label: '', description: '', required: true }] }));
    };

    const updateDocRow = (i, key, val) => {
        setForm(prev => {
            const docs = [...prev.docs];
            docs[i] = { ...docs[i], [key]: val };
            return { ...prev, docs };
        });
    };

    const removeDocRow = (i) => {
        setForm(prev => ({ ...prev, docs: prev.docs.filter((_, idx) => idx !== i) }));
    };

    const copyLink = (url) => {
        navigator.clipboard.writeText(url);
        setCopiedId(url);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const statusBadge = (status) => {
        const colors = {
            Pending: { bg: '#fff7ed', color: '#ea580c' },
            PartiallyUploaded: { bg: '#eff6ff', color: '#2563eb' },
            Complete: { bg: '#f0fdf4', color: '#059669' },
            Expired: { bg: '#fef2f2', color: '#dc2626' }
        };
        const c = colors[status] || colors.Pending;
        return (
            <span style={{
                padding: '2px 10px', borderRadius: '12px', fontSize: '0.7rem',
                fontWeight: 700, background: c.bg, color: c.color
            }}>
                {status}
            </span>
        );
    };

    const uploadProgress = (docs) => {
        const total = docs.length;
        const done = docs.filter(d => d.uploadedFile?.filename).length;
        return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
            <div className="page-header">
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                        <Send size={26} style={{ marginRight: '10px', verticalAlign: 'middle', color: 'var(--color-primary)' }} />
                        Document Requests
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        Request documents from clients via secure shareable links — no login required for them.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <Plus size={18} /> New Request
                </button>
            </div>

            {/* Requests Table */}
            {loading ? (
                <div className="loading-state"><Loader size={24} className="spin" /> Loading...</div>
            ) : requests.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <Send size={48} color="var(--color-primary)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <h3>No document requests yet</h3>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>
                        Create your first request to start collecting documents from clients.
                    </p>
                    <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openCreateModal}>
                        <Plus size={16} /> Create Request
                    </button>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '1.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                                <th style={thStyle}>Client</th>
                                <th style={thStyle}>Notice</th>
                                <th style={thStyle}>Documents</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Created</th>
                                <th style={thStyle}>Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(r => {
                                const prog = uploadProgress(r.requestedDocs);
                                return (
                                    <tr key={r._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 600 }}>{r.clientId?.name || r.clientName}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{r.clientEmail}</div>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{ fontSize: '0.8rem' }}>
                                                {r.noticeId?.department} · s.{r.noticeId?.section}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '60px', height: '6px', borderRadius: '3px',
                                                    background: '#e2e8f0', overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${prog.pct}%`, height: '100%',
                                                        background: prog.pct === 100 ? 'var(--color-success)' : 'var(--color-primary)',
                                                        borderRadius: '3px'
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                    {prog.done}/{prog.total}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={tdStyle}>{statusBadge(r.status)}</td>
                                        <td style={tdStyle}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                {new Date(r.createdAt).toLocaleDateString('en-IN')}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => copyLink(`${window.location.origin}/portal/${r.accessToken}`)}
                                                title="Copy shareable link"
                                            >
                                                {copiedId === `${window.location.origin}/portal/${r.accessToken}`
                                                    ? <CheckCircle size={14} color="var(--color-success)" />
                                                    : <Copy size={14} />
                                                }
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontWeight: 700 }}>New Document Request</h3>
                            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}><X size={18} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Notice</label>
                                <select className="form-control" value={form.noticeId} onChange={e => setForm(p => ({ ...p, noticeId: e.target.value }))}>
                                    <option value="">Select notice...</option>
                                    {notices.map(n => (
                                        <option key={n._id} value={n._id}>
                                            {n.department} · s.{n.section} ({n.assessmentYear})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Client</label>
                                <select className="form-control" value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}>
                                    <option value="">Select client...</option>
                                    {clients.map(c => (
                                        <option key={c._id} value={c._id}>{c.name} · {c.pan}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Client Email (for sharing link)</label>
                            <input className="form-control" type="email" value={form.clientEmail}
                                onChange={e => setForm(p => ({ ...p, clientEmail: e.target.value }))}
                                placeholder="client@company.com" />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="form-label">Message to Client</label>
                            <textarea className="form-control" rows={2} value={form.message}
                                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                                placeholder="Please upload the following documents at your earliest convenience..." />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Requested Documents</label>
                            {form.docs.map((doc, i) => (
                                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                    <input className="form-control" style={{ flex: 1 }} value={doc.label}
                                        onChange={e => updateDocRow(i, 'label', e.target.value)} placeholder="e.g. Bank Statement FY 2023-24" />
                                    <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                        <input type="checkbox" checked={doc.required} onChange={e => updateDocRow(i, 'required', e.target.checked)} />
                                        Required
                                    </label>
                                    {form.docs.length > 1 && (
                                        <button className="btn btn-ghost btn-sm" onClick={() => removeDocRow(i)}>
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button className="btn btn-secondary btn-sm" onClick={addDocRow} style={{ marginTop: '4px' }}>
                                <Plus size={14} /> Add Document
                            </button>
                        </div>

                        <button className="btn btn-primary btn-block" onClick={handleCreate} disabled={creating}
                            style={{ padding: '12px', marginTop: '0.5rem' }}>
                            {creating
                                ? <><Loader size={16} className="spin" /> Creating...</>
                                : <><Send size={16} /> Create & Copy Link</>
                            }
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '12px 16px' };

export default DocumentRequests;
