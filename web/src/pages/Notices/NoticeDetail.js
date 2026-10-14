import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { noticesApi, documentsApi } from '../../api/endpoints';
import { useAuth } from '../../auth/AuthContext';
import {
    ArrowLeft, Calendar, AlertTriangle, User, FileText,
    Clock, CheckCircle, Edit2, Download, PenTool
} from 'lucide-react';
import './Notices.css';

const STATUS_COLORS = {
    New: 'badge-info', Acknowledged: 'badge-primary', InProgress: 'badge-warning',
    ResponseDrafted: 'badge-primary', Filed: 'badge-success', Closed: 'badge-gray', Escalated: 'badge-danger',
};
const PRIORITY_COLORS = { Low: 'badge-gray', Medium: 'badge-primary', High: 'badge-warning', Critical: 'badge-danger' };
const STATUS_OPTIONS = ['New', 'Acknowledged', 'InProgress', 'ResponseDrafted', 'Filed', 'Closed', 'Escalated'];

const NoticeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [notice, setNotice] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [noticeRes, docsRes] = await Promise.all([
                    noticesApi.getById(id),
                    documentsApi.list({ noticeId: id, limit: 100 })
                ]);
                setNotice(noticeRes.data.data);
                setDocuments(docsRes.data.data);
            } catch (err) {
                console.error('Failed to load notice:', err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

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
            alert('Download failed');
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            const res = await noticesApi.changeStatus(id, newStatus);
            setNotice(res.data.data);
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const formatCurrency = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';
    const isOverdue = notice?.dueDate && !['Filed', 'Closed'].includes(notice?.status) && new Date(notice.dueDate) < new Date();
    const daysUntilDue = notice?.dueDate ? Math.ceil((new Date(notice.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;

    if (loading) return <div className="page-loading"><div className="spinner spinner-lg"></div></div>;
    if (!notice) return <div className="empty-state"><h3>Notice not found</h3></div>;

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button className="btn btn-ghost" onClick={() => navigate('/notices')}>
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        {notice.department} Notice — {notice.section || notice.noticeType || 'General'}
                    </h1>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <span className={`badge ${STATUS_COLORS[notice.status]}`}>{notice.status}</span>
                        <span className={`badge ${PRIORITY_COLORS[notice.priority]}`}>{notice.priority}</span>
                        {isOverdue && <span className="badge badge-danger">OVERDUE</span>}
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => navigate(`/responses?noticeId=${id}`)}>
                    <PenTool size={18} /> Draft Response
                </button>
            </div>

            <div className="notice-detail">
                {/* Main info */}
                <div>
                    {/* Client card */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h3 className="card-title">Client Information</h3>
                        <div className="notice-meta">
                            <div className="meta-item"><span className="meta-label">Name</span><span className="meta-value">{notice.clientId?.name || '—'}</span></div>
                            <div className="meta-item"><span className="meta-label">PAN</span><span className="meta-value" style={{ fontFamily: 'monospace' }}>{notice.clientId?.pan || '—'}</span></div>
                            <div className="meta-item"><span className="meta-label">Entity Type</span><span className="meta-value">{notice.clientId?.entityType || '—'}</span></div>
                            <div className="meta-item"><span className="meta-label">Primary Contact</span><span className="meta-value">{notice.clientId?.contacts?.[0]?.name || '—'}</span></div>
                        </div>
                    </div>

                    {/* Notice details */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h3 className="card-title">Notice Details</h3>
                        <div className="notice-meta">
                            <div className="meta-item"><span className="meta-label">Department</span><span className="meta-value">{notice.department}</span></div>
                            <div className="meta-item"><span className="meta-label">Section</span><span className="meta-value">{notice.section || '—'}</span></div>
                            <div className="meta-item"><span className="meta-label">Notice Type</span><span className="meta-value">{notice.noticeType || '—'}</span></div>
                            <div className="meta-item"><span className="meta-label">Assessment Year</span><span className="meta-value">{notice.assessmentYear || '—'}</span></div>
                            <div className="meta-item"><span className="meta-label">Financial Year</span><span className="meta-value">{notice.financialYear || '—'}</span></div>
                            <div className="meta-item"><span className="meta-label">DIN</span><span className="meta-value" style={{ fontFamily: 'monospace' }}>{notice.din || '—'}</span></div>
                            <div className="meta-item"><span className="meta-label">CPC Reference</span><span className="meta-value">{notice.cpcRefNo || '—'}</span></div>
                            <div className="meta-item"><span className="meta-label">Demand Amount</span><span className="meta-value" style={{ fontWeight: 600 }}>{formatCurrency(notice.demandAmount)}</span></div>
                        </div>
                    </div>

                    {/* Notes */}
                    {notice.notes && (
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <h3 className="card-title">Notes</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{notice.notes}</p>
                        </div>
                    )}

                    {/* Documents */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 className="card-title" style={{ marginBottom: 0 }}>Documents</h3>
                        </div>
                        {documents.length === 0 ? (
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No documents attached.</p>
                        ) : (
                            <div className="document-list">
                                {documents.map(doc => (
                                    <div key={doc._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <FileText size={18} style={{ color: 'var(--color-primary)' }} />
                                            <div>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{doc.originalName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.category} • {formatDate(doc.createdAt)}</div>
                                            </div>
                                        </div>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDownload(doc)}>
                                            <Download size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div>
                    {/* Dates card */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h3 className="card-title">Important Dates</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div className="meta-item"><span className="meta-label">Issue Date</span><span className="meta-value">{formatDate(notice.issueDate)}</span></div>
                            <div className="meta-item"><span className="meta-label">Received Date</span><span className="meta-value">{formatDate(notice.receivedDate)}</span></div>
                            <div className="meta-item">
                                <span className="meta-label">Due Date</span>
                                <span className="meta-value" style={{ color: isOverdue ? 'var(--color-danger)' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
                                    {formatDate(notice.dueDate)}
                                    {daysUntilDue !== null && (
                                        <span style={{ fontSize: '0.75rem', marginLeft: '0.5rem', color: isOverdue ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                                            ({isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`})
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="meta-item"><span className="meta-label">Hearing Date</span><span className="meta-value">{formatDate(notice.hearingDate)}</span></div>
                        </div>
                    </div>

                    {/* Assignment card */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h3 className="card-title">Assignment</h3>
                        <div className="meta-item" style={{ marginBottom: '0.75rem' }}>
                            <span className="meta-label">Assigned To</span>
                            <span className="meta-value">
                                {notice.assignedTo ? `${notice.assignedTo.firstName} ${notice.assignedTo.lastName}` : 'Unassigned'}
                            </span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Created By</span>
                            <span className="meta-value">
                                {notice.createdBy ? `${notice.createdBy.firstName} ${notice.createdBy.lastName}` : '—'}
                            </span>
                        </div>
                    </div>

                    {/* Status change */}
                    <div className="card">
                        <h3 className="card-title">Change Status</h3>
                        <select
                            className="input select"
                            value={notice.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoticeDetail;
