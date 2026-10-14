import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { responsesApi, noticesApi } from '../../api/endpoints';
import { useAuth } from '../../auth/AuthContext';
import { Plus, FileText, Clock, CheckCircle, AlertTriangle, Eye, Send, X, ChevronLeft, ChevronRight, PenTool, Download } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './Responses.css';

const QUILL_MODULES = {
    toolbar: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
        ['link'],
        ['clean']
    ],
};

const QUILL_FORMATS = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link'
];

const STATUS_COLORS = {
    Draft: 'badge-gray', InReview: 'badge-warning', Approved: 'badge-success',
    RevisionRequested: 'badge-danger', Filed: 'badge-primary',
};

const ResponseStudio = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, hasAnyRole } = useAuth();
    const [responses, setResponses] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [editingResponse, setEditingResponse] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');

    const noticeIdFromUrl = searchParams.get('noticeId');
    const responseIdFromUrl = searchParams.get('responseId');

    const fetchResponses = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (noticeIdFromUrl) params.noticeId = noticeIdFromUrl;
            if (statusFilter) params.status = statusFilter;
            const res = await responsesApi.list(params);
            setResponses(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Failed to load responses:', err);
        } finally {
            setLoading(false);
        }
    }, [noticeIdFromUrl, statusFilter]);

    useEffect(() => {
        fetchResponses();
        
        // Auto-open editor if coming from notice detail with a specific response
        if (responseIdFromUrl) {
            responsesApi.getById(responseIdFromUrl).then(res => {
                setEditingResponse(res.data.data);
                setShowEditor(true);
            }).catch(err => console.error('Failed to fetch response:', err));
        } else if (noticeIdFromUrl) {
            setShowEditor(true);
        }
    }, [fetchResponses, noticeIdFromUrl, responseIdFromUrl]);

    const handleCreateNew = () => {
        setEditingResponse(null);
        setShowEditor(true);
    };

    const handleEdit = (resp) => {
        setEditingResponse(resp);
        setShowEditor(true);
    };

    const handleSaved = () => {
        setShowEditor(false);
        setEditingResponse(null);
        fetchResponses(pagination.page);
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="responses-page">
            {!showEditor ? (
                <>
                    <div className="page-header">
                        <h1>Response Studio</h1>
                        <button className="btn btn-primary" onClick={handleCreateNew}>
                            <Plus size={18} /> New Response
                        </button>
                    </div>

                    {/* Filter */}
                    <div className="filter-bar" style={{ marginBottom: '1rem' }}>
                        <select className="input select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="Draft">Draft</option>
                            <option value="InReview">In Review</option>
                            <option value="Approved">Approved</option>
                            <option value="RevisionRequested">Revision Requested</option>
                            <option value="Filed">Filed</option>
                        </select>
                    </div>

                    {/* Responses table */}
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Notice</th>
                                    <th>Subject</th>
                                    <th>Version</th>
                                    <th>Status</th>
                                    <th>Drafted By</th>
                                    <th>Updated</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: 'auto' }}></div></td></tr>
                                ) : responses.length === 0 ? (
                                    <tr><td colSpan={7}>
                                        <div className="empty-state">
                                            <PenTool size={40} />
                                            <h3>No responses yet</h3>
                                            <p>Create a response to a notice to get started.</p>
                                        </div>
                                    </td></tr>
                                ) : responses.map(resp => (
                                    <tr key={resp._id}>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <strong>{resp.noticeId?.department || '—'}</strong>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {resp.noticeId?.section || ''} {resp.noticeId?.assessmentYear || ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td>{resp.subject || 'Untitled'}</td>
                                        <td><span className="badge badge-gray">v{resp.version}</span></td>
                                        <td><span className={`badge ${STATUS_COLORS[resp.status]}`}>{resp.status}</span></td>
                                        <td>{resp.draftedBy ? `${resp.draftedBy.firstName} ${resp.draftedBy.lastName}` : '—'}</td>
                                        <td>{formatDate(resp.updatedAt)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                {['Draft', 'RevisionRequested'].includes(resp.status) && (
                                                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(resp)} title="Edit">
                                                        <PenTool size={15} />
                                                    </button>
                                                )}
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(resp)} title="View">
                                                    <Eye size={15} />
                                                </button>
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
                                    <button className="btn btn-ghost btn-sm" disabled={!pagination.hasPrev} onClick={() => fetchResponses(pagination.page - 1)}>
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button className="btn btn-ghost btn-sm" disabled={!pagination.hasNext} onClick={() => fetchResponses(pagination.page + 1)}>
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <ResponseEditor
                    response={editingResponse}
                    noticeId={noticeIdFromUrl}
                    onSaved={handleSaved}
                    onClose={() => { setShowEditor(false); setEditingResponse(null); }}
                    isReviewer={hasAnyRole('Partner', 'TenantAdmin', 'SuperAdmin')}
                />
            )}
        </div>
    );
};

// ── Response Editor ────────────────────────────────────
const ResponseEditor = ({ response, noticeId, onSaved, onClose, isReviewer }) => {
    const [form, setForm] = useState({
        noticeId: response?.noticeId?._id || response?.noticeId || noticeId || '',
        subject: response?.subject || '',
        body: response?.body || '',
        letterhead: response?.letterhead || {
            firmName: '', firmAddress: '', firmPhone: '', firmEmail: '', firmGSTIN: '',
        },
    });
    const [notices, setNotices] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [comment, setComment] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);

    const isEditable = !response || ['Draft', 'RevisionRequested'].includes(response?.status);
    const canSubmitReview = response && ['Draft', 'RevisionRequested'].includes(response?.status);
    const canApprove = response && response?.status === 'InReview' && isReviewer;
    const canGeneratePdf = response && ['Approved', 'Filed'].includes(response?.status);
    const canMarkFiled = response && response?.status === 'Approved';

    useEffect(() => {
        if (!response) {
            noticesApi.list({ limit: 100 }).then(res => setNotices(res.data.data)).catch(() => { });
        }
    }, [response]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleLetterheadChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, letterhead: { ...prev.letterhead, [name]: value } }));
    };

    const handleSave = async () => {
        setSaving(true); setError('');
        try {
            if (response) {
                await responsesApi.update(response._id, { subject: form.subject, body: form.body, letterhead: form.letterhead });
            } else {
                await responsesApi.create(form);
            }
            onSaved();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save');
        } finally { setSaving(false); }
    };

    const handleSubmitReview = async () => {
        try {
            await responsesApi.submitReview(response._id);
            onSaved();
        } catch (err) { setError(err.response?.data?.message || 'Failed to submit'); }
    };

    const handleApprove = async () => {
        try {
            await responsesApi.approve(response._id);
            onSaved();
        } catch (err) { setError(err.response?.data?.message || 'Failed to approve'); }
    };

    const handleReject = async () => {
        if (!comment.trim()) { setError('Please add a comment before requesting revision'); return; }
        try {
            await responsesApi.reject(response._id, { comment });
            onSaved();
        } catch (err) { setError(err.response?.data?.message || 'Failed to reject'); }
    };

    const handleGeneratePdf = async () => {
        try {
            const res = await responsesApi.generatePdf(response._id);
            setPdfPreview(res.data.data.html);
        } catch (err) { setError(err.response?.data?.message || 'Failed to generate PDF'); }
    };

    const handleMarkFiled = async () => {
        try {
            await responsesApi.markFiled(response._id, {
                filedDate: new Date().toISOString(),
                filingMode: 'Online',
            });
            onSaved();
        } catch (err) { setError(err.response?.data?.message || 'Failed to mark filed'); }
    };

    return (
        <div className="response-editor">
            {/* Editor Header */}
            <div className="editor-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button className="btn btn-ghost" onClick={onClose}><X size={20} /></button>
                    <h2>{response ? `Response v${response.version}` : 'New Response'}</h2>
                    {response && <span className={`badge ${STATUS_COLORS[response.status]}`}>{response.status}</span>}
                </div>
                <div className="editor-actions">
                    {isEditable && (
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving && <div className="spinner"></div>}
                            {response ? 'Save Draft' : 'Create Draft'}
                        </button>
                    )}
                    {canSubmitReview && (
                        <button className="btn btn-primary" onClick={handleSubmitReview}>
                            <Send size={16} /> Submit for Review
                        </button>
                    )}
                    {canApprove && (
                        <>
                            <button className="btn btn-primary" onClick={handleApprove} style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
                                <CheckCircle size={16} /> Approve
                            </button>
                            <button className="btn btn-danger" onClick={handleReject}>
                                <AlertTriangle size={16} /> Request Revision
                            </button>
                        </>
                    )}
                    {canGeneratePdf && (
                        <button className="btn btn-secondary" onClick={handleGeneratePdf}>
                            <Download size={16} /> Generate PDF
                        </button>
                    )}
                    {canMarkFiled && (
                        <button className="btn btn-primary" onClick={handleMarkFiled} style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
                            <FileText size={16} /> Mark as Filed
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="login-error" style={{ margin: '0 0 1rem' }}>{error}</div>}

            {/* PDF Preview Modal */}
            {pdfPreview && (
                <div className="modal-overlay" onClick={() => setPdfPreview(null)}>
                    <div className="modal" style={{ maxWidth: '900px', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>PDF Preview</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setPdfPreview(null)}><X size={18} /></button>
                        </div>
                        <div className="modal-body" style={{ padding: 0 }}>
                            <iframe
                                title="PDF Preview"
                                srcDoc={pdfPreview}
                                style={{ width: '100%', height: '70vh', border: 'none' }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="editor-layout">
                {/* Main editor */}
                <div className="editor-main">
                    {/* Notice selector (only for new) */}
                    {!response && (
                        <div className="card" style={{ marginBottom: '1rem' }}>
                            <div className="input-group">
                                <label>Select Notice *</label>
                                <select className="input select" name="noticeId" value={form.noticeId} onChange={handleChange} required>
                                    <option value="">Choose a notice...</option>
                                    {notices.map(n => (
                                        <option key={n._id} value={n._id}>
                                            {n.clientId?.name || 'Unknown'} — {n.department} {n.section || ''} ({n.assessmentYear || ''})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Subject */}
                    <div className="card" style={{ marginBottom: '1rem' }}>
                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label>Subject</label>
                            <input
                                className="input"
                                name="subject"
                                value={form.subject}
                                onChange={handleChange}
                                placeholder="e.g. Reply to Intimation u/s 143(1) for AY 2024-25"
                                disabled={!isEditable}
                            />
                        </div>

                        {/* Rich text body editor */}
                        <div className="input-group">
                            <label>Response Body *</label>
                            <div className="rich-editor-container">
                                <ReactQuill
                                    theme="snow"
                                    value={form.body}
                                    onChange={(content) => setForm(prev => ({ ...prev, body: content }))}
                                    modules={QUILL_MODULES}
                                    formats={QUILL_FORMATS}
                                    readOnly={!isEditable}
                                    placeholder="Respected Sir/Madam,&#10;&#10;With reference to the above captioned notice...&#10;&#10;We hereby submit the following..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reviewer comments */}
                    {response?.reviewerComments?.length > 0 && (
                        <div className="card" style={{ marginBottom: '1rem' }}>
                            <h3 className="card-title">Reviewer Comments</h3>
                            {response.reviewerComments.map((c, i) => (
                                <div key={i} className="reviewer-comment">
                                    <div className="reviewer-comment-header">
                                        <span className="badge badge-warning">Reviewer</span>
                                        <span>{new Date(c.createdAt).toLocaleString('en-IN')}</span>
                                    </div>
                                    <p>{c.comment}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add comment (reviewer) */}
                    {canApprove && (
                        <div className="card">
                            <h3 className="card-title">Add Comment</h3>
                            <textarea
                                className="input"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a comment for the drafter..."
                                rows={3}
                            />
                        </div>
                    )}
                </div>

                {/* Sidebar — Letterhead */}
                <div className="editor-sidebar">
                    <div className="card">
                        <h3 className="card-title">Letterhead</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div className="input-group">
                                <label>Firm Name</label>
                                <input className="input" name="firmName" value={form.letterhead.firmName} onChange={handleLetterheadChange} disabled={!isEditable} placeholder="ABC & Associates" />
                            </div>
                            <div className="input-group">
                                <label>Address</label>
                                <textarea className="input" name="firmAddress" value={form.letterhead.firmAddress} onChange={handleLetterheadChange} disabled={!isEditable} rows={2} placeholder="Office address..." />
                            </div>
                            <div className="input-group">
                                <label>Phone</label>
                                <input className="input" name="firmPhone" value={form.letterhead.firmPhone} onChange={handleLetterheadChange} disabled={!isEditable} placeholder="+91..." />
                            </div>
                            <div className="input-group">
                                <label>Email</label>
                                <input className="input" name="firmEmail" value={form.letterhead.firmEmail} onChange={handleLetterheadChange} disabled={!isEditable} placeholder="ca@firm.com" />
                            </div>
                            <div className="input-group">
                                <label>GSTIN</label>
                                <input className="input" name="firmGSTIN" value={form.letterhead.firmGSTIN} onChange={handleLetterheadChange} disabled={!isEditable} placeholder="22AAAAA0000A1Z5" />
                            </div>
                        </div>
                    </div>

                    {/* Status timeline */}
                    {response && (
                        <div className="card" style={{ marginTop: '1rem' }}>
                            <h3 className="card-title">History</h3>
                            <div className="response-timeline">
                                <div className="timeline-item">
                                    <div className="timeline-dot" style={{ background: '#2563EB' }}></div>
                                    <div className="timeline-content">
                                        <strong>Created</strong>
                                        <div className="timeline-date">{new Date(response.createdAt).toLocaleString('en-IN')}</div>
                                    </div>
                                </div>
                                {response.submittedAt && (
                                    <div className="timeline-item">
                                        <div className="timeline-dot" style={{ background: '#D97706' }}></div>
                                        <div className="timeline-content">
                                            <strong>Submitted for Review</strong>
                                            <div className="timeline-date">{new Date(response.submittedAt).toLocaleString('en-IN')}</div>
                                        </div>
                                    </div>
                                )}
                                {response.approvedAt && (
                                    <div className="timeline-item">
                                        <div className="timeline-dot" style={{ background: '#059669' }}></div>
                                        <div className="timeline-content">
                                            <strong>Approved</strong>
                                            <div className="timeline-date">{new Date(response.approvedAt).toLocaleString('en-IN')}</div>
                                        </div>
                                    </div>
                                )}
                                {response.filedAt && (
                                    <div className="timeline-item">
                                        <div className="timeline-dot" style={{ background: '#7C3AED' }}></div>
                                        <div className="timeline-content">
                                            <strong>Filed</strong>
                                            <div className="timeline-date">{new Date(response.filedAt).toLocaleString('en-IN')}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResponseStudio;
