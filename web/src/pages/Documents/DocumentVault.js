import React, { useState, useEffect, useCallback } from 'react';
import { documentsApi, noticesApi } from '../../api/endpoints';
import {
    Upload, FileText, Download, Trash2, Search, X,
    File, Image, FileSpreadsheet, ChevronLeft, ChevronRight
} from 'lucide-react';
import './Documents.css';

const CATEGORY_OPTIONS = ['NoticeOriginal', 'SupportingDoc', 'ResponseAttachment', 'Acknowledgement', 'Other'];

const CATEGORY_LABELS = {
    NoticeOriginal: 'Notice Original',
    SupportingDoc: 'Supporting Document',
    ResponseAttachment: 'Response Attachment',
    Acknowledgement: 'Acknowledgement',
    Other: 'Other',
};

const FILE_ICONS = {
    'application/pdf': FileText,
    'image/jpeg': Image,
    'image/png': Image,
    'image/gif': Image,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
    'application/vnd.ms-excel': FileSpreadsheet,
};

const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DocumentVault = () => {
    const [documents, setDocuments] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('');

    const fetchDocuments = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: 25 };
            if (categoryFilter) params.category = categoryFilter;
            const res = await documentsApi.list(params);
            setDocuments(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Failed to load documents:', err);
        } finally {
            setLoading(false);
        }
    }, [categoryFilter]);

    useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

    const handleDownload = async (doc) => {
        try {
            if (doc.mimeType === 'application/pdf') {
                const res = await documentsApi.downloadSecure(doc._id);
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `SECURE_${doc.originalName}`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                const res = await documentsApi.download(doc._id);
                window.open(res.data.data.downloadUrl, '_blank');
            }
        } catch (err) {
            console.error('Download failed:', err);
            alert('Download failed');
        }
    };

    const handleDelete = async (doc) => {
        if (!window.confirm(`Delete "${doc.originalName}"? This cannot be undone.`)) return;
        try {
            await documentsApi.remove(doc._id);
            fetchDocuments(pagination.page);
        } catch (err) {
            alert('Delete failed');
        }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="documents-page">
            <div className="page-header">
                <h1>Document Vault</h1>
                <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
                    <Upload size={18} /> Upload Document
                </button>
            </div>

            {/* Filter */}
            <div className="filter-bar" style={{ marginBottom: '1rem' }}>
                <select className="input select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="">All Categories</option>
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
            </div>

            {/* Documents grid */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>File</th>
                            <th>Category</th>
                            <th>Size</th>
                            <th>Status</th>
                            <th>Uploaded By</th>
                            <th>Uploaded</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: 'auto' }}></div></td></tr>
                        ) : documents.length === 0 ? (
                            <tr><td colSpan={7}>
                                <div className="empty-state">
                                    <File size={40} />
                                    <h3>No documents found</h3>
                                    <p>Upload a document to get started.</p>
                                </div>
                            </td></tr>
                        ) : documents.map(doc => {
                            const IconComp = FILE_ICONS[doc.mimeType] || File;
                            return (
                                <tr key={doc._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <IconComp size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                                            <span style={{ fontWeight: 500 }}>{doc.originalName}</span>
                                        </div>
                                    </td>
                                    <td><span className="badge badge-primary">{CATEGORY_LABELS[doc.category] || doc.category}</span></td>
                                    <td>{formatSize(doc.sizeBytes)}</td>
                                    <td>
                                        <span className={`badge ${doc.uploadStatus === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                                            {doc.uploadStatus}
                                        </span>
                                    </td>
                                    <td>{doc.uploadedBy ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}` : '—'}</td>
                                    <td>{formatDate(doc.createdAt)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            {doc.uploadStatus === 'Completed' && (
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleDownload(doc)} title="Download">
                                                    <Download size={15} />
                                                </button>
                                            )}
                                            <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(doc)} title="Delete" style={{ color: 'var(--color-danger)' }}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {pagination.totalPages > 1 && (
                    <div className="pagination">
                        <span>Page {pagination.page} / {pagination.totalPages}</span>
                        <div className="pagination-buttons">
                            <button className="btn btn-ghost btn-sm" disabled={!pagination.hasPrev} onClick={() => fetchDocuments(pagination.page - 1)}>
                                <ChevronLeft size={16} />
                            </button>
                            <button className="btn btn-ghost btn-sm" disabled={!pagination.hasNext} onClick={() => fetchDocuments(pagination.page + 1)}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUpload && (
                <UploadModal
                    onUploaded={() => { setShowUpload(false); fetchDocuments(); }}
                    onClose={() => setShowUpload(false)}
                />
            )}
        </div>
    );
};

// ── Upload Modal ──────────────────────────────────────
const UploadModal = ({ onUploaded, onClose }) => {
    const [notices, setNotices] = useState([]);
    const [form, setForm] = useState({ noticeId: '', category: 'SupportingDoc', description: '' });
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        noticesApi.list({ limit: 100 }).then(res => setNotices(res.data.data)).catch(() => { });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !form.noticeId) { setError('Select a notice and file'); return; }

        setUploading(true);
        setError('');
        setProgress('Getting upload URL...');

        try {
            // Step 1: Get presigned URL
            const presignRes = await documentsApi.presign({
                noticeId: form.noticeId,
                fileName: file.name,
                fileType: file.type || 'application/octet-stream',
                fileSize: file.size,
                category: form.category,
                description: form.description,
            });

            const { uploadUrl, document: doc } = presignRes.data.data;

            // Step 2: Upload file to presigned URL
            setProgress('Uploading file...');
            await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type || 'application/octet-stream' },
            });

            // Step 3: Confirm upload
            setProgress('Confirming...');
            await documentsApi.complete(doc._id);

            setProgress('Done!');
            onUploaded();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Upload Document</h2>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label>Notice *</label>
                            <select className="input select" value={form.noticeId} onChange={(e) => setForm({ ...form, noticeId: e.target.value })} required>
                                <option value="">Select notice...</option>
                                {notices.map(n => (
                                    <option key={n._id} value={n._id}>
                                        {n.clientId?.name || 'Unknown'} — {n.department} {n.section || ''} ({n.assessmentYear || ''})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label>Category</label>
                            <select className="input select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                            </select>
                        </div>

                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <label>File *</label>
                            <div className="upload-dropzone">
                                <input
                                    type="file"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="upload-file-input"
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv,.zip"
                                />
                                {file ? (
                                    <div className="upload-file-info">
                                        <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                                        <div>
                                            <strong>{file.name}</strong>
                                            <span>{formatSize(file.size)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="upload-placeholder">
                                        <Upload size={32} style={{ color: 'var(--text-muted)' }} />
                                        <p>Choose a file or drag & drop</p>
                                        <span>PDF, Images, Excel, Word (max 100 MB)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Description</label>
                            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description..." />
                        </div>

                        {progress && <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--color-primary)' }}>{progress}</p>}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={uploading}>
                            {uploading && <div className="spinner"></div>}
                            Upload
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DocumentVault;
