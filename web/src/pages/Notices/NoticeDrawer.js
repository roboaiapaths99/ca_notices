import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    X, AlertTriangle, Clock, CheckCircle, 
    MessageSquare, Download, Sparkles, Send, Loader,
    Eye, Shield, FileText, BookOpen, ClipboardList,
    Scale, ChevronRight, RefreshCw, User, UserCheck
} from 'lucide-react';
import api from '../../api/axios';
import { noticesApi, responsesApi } from '../../api/endpoints';

const RISK_CONFIG = {
    Low: { color: '#059669', bg: '#D1FAE5', label: 'Low Risk' },
    Medium: { color: '#D97706', bg: '#FEF3C7', label: 'Medium Risk' },
    High: { color: '#DC2626', bg: '#FEE2E2', label: 'High Risk' },
};

const NoticeDrawer = ({ notice, onClose, onStatusChange }) => {
    const navigate = useNavigate();
    const [isDrafting, setIsDrafting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [activities, setActivities] = useState([]);
    const [comments, setComments] = useState(notice?.comments || []);
    const [newComment, setNewComment] = useState('');
    const [postingComment, setPostingComment] = useState(false);
    const [aiInsights, setAiInsights] = useState(notice?.aiInsights || null);
    const [draftText, setDraftText] = useState('');
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [activeTab, setActiveTab] = useState('analysis');
    const [team, setTeam] = useState([]);
    const [isAssigning, setIsAssigning] = useState(false);

    const fetchActivities = useCallback(async () => {
        if (!notice?._id) return;
        setLoadingActivities(true);
        try {
            const res = await noticesApi.getActivities(notice._id);
            const mapped = res.data.data.map(log => ({
                id: log._id,
                title: log.action.replace(/_/g, ' '),
                sub: `${log.actorEmail} · ${new Date(log.createdAt).toLocaleString()}`,
                icon: getIconForAction(log.action),
                bg: getBgForAction(log.action)
            }));
            setActivities(mapped);
        } catch (err) {
            console.error('Failed to fetch activities', err);
        } finally {
            setLoadingActivities(false);
        }
    }, [notice?._id]);

    useEffect(() => {
        if (notice) {
            fetchActivities();
            setComments(notice.comments || []);
            setAiInsights(notice.aiInsights || null);
            fetchTeam();
        }
    }, [notice, fetchActivities]);

    const fetchTeam = async () => {
        try {
            const res = await api.get('/api/auth/team');
            setTeam(res.data.data);
        } catch (err) {
            console.error('Failed to fetch team');
        }
    };

    if (!notice) return null;

    const getIconForAction = (action) => {
        if (action.includes('CREATE')) return <AlertTriangle size={14} color="var(--color-critical)" />;
        if (action.includes('STATUS')) return <CheckCircle size={14} color="var(--color-success)" />;
        if (action.includes('RESPONSE')) return <Sparkles size={14} color="var(--color-primary)" />;
        return <Eye size={14} color="var(--color-info)" />;
    };

    const getBgForAction = (action) => {
        if (action.includes('CREATE')) return 'var(--color-critical-light)';
        if (action.includes('STATUS')) return 'var(--color-success-light)';
        if (action.includes('RESPONSE')) return 'var(--color-primary-light)';
        return 'var(--color-info-light)';
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const formatCurrency = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';
    
    const statusType = notice.priority === 'Critical' ? 'critical' : 
                      notice.priority === 'High' ? 'warning' : 'info';

    // ── AI Analysis ──────────────────────────────────────
    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const res = await noticesApi.analyzeNotice(notice._id);
            setAiInsights(res.data.data);
            await fetchActivities();
            if (onStatusChange) onStatusChange(); // Notify parent to refresh list
        } catch (err) {
            console.error('AI analysis failed:', err);
            alert('AI Analysis failed. Please check your internet or API configuration.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ── AI Draft Response ────────────────────────────────
    const handleDraftResponse = async () => {
        setIsDrafting(true);
        try {
            const res = await noticesApi.draftAI(notice._id);
            setDraftText(res.data.data.draft);
            setShowDraftModal(true);
            await fetchActivities();
            if (onStatusChange) onStatusChange(); // Notify parent
        } catch (err) {
            console.error('Draft failed:', err);
            alert('Failed to generate AI draft. Please try again.');
        } finally {
            setIsDrafting(false);
        }
    };

    // ── Download Notice ──────────────────────────────────
    const handleDownload = () => {
        if (!notice.fileUrl && !notice.extractedFields?.tempPath) {
            alert('No document attached to this notice record.');
            return;
        }
        // In a real app, this would be a signed URL or a direct download API
        const downloadUrl = notice.fileUrl 
            ? (notice.fileUrl.startsWith('http') ? notice.fileUrl : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${notice.fileUrl}`)
            : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notices/download/${notice._id}`;
        
        window.open(downloadUrl, '_blank');
    };

    // ── Comment ──────────────────────────────────────────
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setPostingComment(true);
        try {
            const res = await noticesApi.addComment(notice._id, newComment);
            setComments(res.data.data);
            setNewComment('');
            fetchActivities();
        } catch (err) {
            console.error('Failed to post comment');
        } finally {
            setPostingComment(false);
        }
    };

    const handleAssign = async (userId) => {
        setIsAssigning(true);
        try {
            await noticesApi.assign(notice._id, userId);
            alert('Notice assigned successfully');
            fetchActivities();
            if (onStatusChange) onStatusChange();
        } catch (err) {
            console.error('Failed to assign notice');
        } finally {
            setIsAssigning(false);
        }
    };

    const renderCommentText = (text) => {
        return text.split(/(@\w+)/g).map((part, i) => {
            if (part && part.startsWith('@')) {
                return <span key={i} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{part}</span>;
            }
            return part;
        });
    };

    // ── Risk Badge ───────────────────────────────────────
    const riskConfig = RISK_CONFIG[aiInsights?.riskLevel] || RISK_CONFIG.Medium;

    return (
        <>
            <div className="notice-drawer-overlay" onClick={onClose} />
            <div className={`notice-drawer ${statusType}`}>
                <div className="drawer-header">
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{notice.department} Notice</h2>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                            {notice.din || notice.section || 'General Reference'}
                        </p>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="drawer-body">
                    {/* Progress Stepper */}
                    <div className="notice-progress">
                        {[
                            { label: 'Received', status: 'done' },
                            { label: 'Reviewed', status: 'done' },
                            { label: 'Responding', status: notice.status === 'ResponseDrafted' ? 'done' : 'active' },
                            { label: 'Filed', status: notice.status === 'Filed' ? 'done' : 'pending' }
                        ].map((step, idx) => (
                            <div key={idx} className="np-step">
                                <div className={`np-circle ${step.status}`}>
                                    {step.status === 'done' ? '✓' : step.status === 'active' ? '●' : idx + 1}
                                </div>
                                <div className="np-label">{step.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Metadata Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.5rem 0' }}>
                        <div className="meta-item">
                            <span className="meta-label">Client</span>
                            <span className="meta-value">{notice.clientId?.name}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Demand</span>
                            <span className="meta-value" style={{ color: 'var(--color-critical)', fontWeight: 700 }}>
                                {formatCurrency(notice.demandAmount)}
                            </span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">Due Date</span>
                            <span className="meta-value" style={{ color: 'var(--color-critical)' }}>{formatDate(notice.dueDate)}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-label">AY / FY</span>
                            <span className="meta-value">{notice.assessmentYear || notice.financialYear}</span>
                        </div>
                        <div className="meta-item" style={{ gridColumn: 'span 2' }}>
                            <span className="meta-label">Assigned To</span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                <select 
                                    className="form-control"
                                    style={{ fontSize: '0.75rem', height: '32px' }}
                                    defaultValue={notice.assignedTo?._id || notice.assignedTo || ''}
                                    onChange={(e) => handleAssign(e.target.value)}
                                    disabled={isAssigning}
                                >
                                    <option value="">Unassigned</option>
                                    {team.map(u => (
                                        <option key={u._id} value={u._id}>
                                            {u.firstName} {u.lastName} ({u.roles[0]})
                                        </option>
                                    ))}
                                </select>
                                {notice.assignedTo ? <UserCheck size={16} color="var(--color-success)" /> : <User size={16} color="var(--color-text-muted)" />}
                            </div>
                        </div>
                    </div>

                    {/* Reconciliation Info */}
                    {notice.reconciliationStatus && notice.reconciliationStatus !== 'None' && (
                        <div style={{
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            borderRadius: '12px',
                            background: notice.reconciliationStatus === 'Matched' ? '#f0fdf4' : '#fffbeb',
                            border: `1px solid ${notice.reconciliationStatus === 'Matched' ? '#bbf7d0' : '#fef3c7'}`,
                            display: 'flex',
                            gap: '0.75rem'
                        }}>
                            {notice.reconciliationStatus === 'Matched' ? (
                                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                            )}
                            <div>
                                <h4 style={{ 
                                    fontSize: '0.875rem', 
                                    fontWeight: 700, 
                                    color: notice.reconciliationStatus === 'Matched' ? '#166534' : '#92400e',
                                    marginBottom: '2px'
                                }}>
                                    {notice.reconciliationStatus === 'Matched' ? 'Books Reconciled' : 'Reconciliation Discrepancy'}
                                </h4>
                                <p style={{ fontSize: '0.75rem', color: notice.reconciliationStatus === 'Matched' ? '#15803d' : '#a16207' }}>
                                    {notice.reconciliationStatus === 'Matched' 
                                        ? `Matched with ledger entry: ${notice.ledgerMatch?.particulars || 'N/A'}`
                                        : 'A matching amount was found in the books, but identity could not be verified.'
                                    }
                                </p>
                                {notice.ledgerMatch?.date && (
                                    <span style={{ fontSize: '0.65rem', opacity: 0.8, display: 'block', marginTop: '4px' }}>
                                        Entry Date: {formatDate(notice.ledgerMatch.date)}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── AI Intelligence Tabs ──────────────── */}
                    <div className="ai-tabs-wrapper">
                        <div className="ai-tabs">
                            {[
                                { key: 'analysis', label: 'AI Analysis', icon: <Sparkles size={14} /> },
                                { key: 'sop', label: 'SOP Steps', icon: <ClipboardList size={14} /> },
                                { key: 'documents', label: 'Documents', icon: <FileText size={14} /> },
                                { key: 'legal', label: 'Legal Refs', icon: <Scale size={14} /> },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    className={`ai-tab ${activeTab === tab.key ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.key)}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="ai-tab-content">
                            {!aiInsights ? (
                                /* No analysis yet — show CTA */
                                <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                                    <Sparkles size={32} style={{ color: 'var(--color-primary)', marginBottom: '0.75rem' }} />
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                        Run AI analysis to get section-specific guidance, risk assessment, and required documents.
                                    </p>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing}
                                    >
                                        {isAnalyzing ? <><Loader size={14} className="spinner" /> Analyzing...</> : <><Sparkles size={14} /> Analyze Notice</>}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Risk badge */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                            padding: '4px 12px', borderRadius: '20px',
                                            background: riskConfig.bg, color: riskConfig.color,
                                            fontWeight: 700, fontSize: '0.75rem'
                                        }}>
                                            <Shield size={12} /> {riskConfig.label}
                                        </div>
                                        <button className="btn btn-ghost btn-sm" onClick={handleAnalyze} disabled={isAnalyzing} title="Re-analyze">
                                            {isAnalyzing ? <Loader size={14} className="spinner" /> : <RefreshCw size={14} />}
                                        </button>
                                    </div>
                                    {aiInsights.source && (
                                        <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                                            Powered by {aiInsights.source === 'openai' ? 'OpenAI GPT-4o' : 'Rule-based Heuristics'}
                                        </div>
                                    )}

                                    {/* Tab: Analysis */}
                                    {activeTab === 'analysis' && (
                                        <div>
                                            <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: '#1e293b', marginBottom: '1rem' }}>
                                                {aiInsights.summary}
                                            </p>
                                            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-primary)' }}>
                                                Action Points
                                            </h4>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                {aiInsights.actionPoints?.map((point, i) => (
                                                    <li key={i} style={{
                                                        display: 'flex', alignItems: 'flex-start', gap: '8px',
                                                        padding: '6px 0', fontSize: '0.8125rem', color: '#334155', lineHeight: 1.4
                                                    }}>
                                                        <ChevronRight size={14} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
                                                        {point}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Tab: SOP Steps */}
                                    {activeTab === 'sop' && (
                                        <div>
                                            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '12px', color: 'var(--color-primary)' }}>
                                                <ClipboardList size={14} style={{ marginRight: '6px' }} /> Standard Operating Procedure
                                            </h4>
                                            {aiInsights.sopSteps?.map((step, i) => (
                                                <div key={i} style={{
                                                    display: 'flex', gap: '12px', marginBottom: '12px',
                                                }}>
                                                    <div style={{
                                                        width: '24px', height: '24px', borderRadius: '50%',
                                                        background: 'var(--color-primary)', color: '#fff',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0
                                                    }}>
                                                        {i + 1}
                                                    </div>
                                                    <p style={{ fontSize: '0.8125rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                                                        {step}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Tab: Documents Required */}
                                    {activeTab === 'documents' && (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                                                    <FileText size={14} style={{ marginRight: '6px' }} /> Documents Required
                                                </h4>
                                                <button 
                                                    className="btn btn-primary btn-sm" 
                                                    style={{ fontSize: '0.65rem', padding: '2px 8px' }}
                                                    onClick={() => navigate('/document-requests', { state: { noticeId: notice._id, clientId: notice.clientId?._id || notice.clientId, docs: aiInsights.documentsRequired } })}
                                                >
                                                    <Send size={10} style={{ marginRight: '4px' }} /> Request Now
                                                </button>
                                            </div>
                                            {aiInsights.documentsRequired?.map((doc, i) => (
                                                <div key={i} style={{
                                                    display: 'flex', alignItems: 'center', gap: '10px',
                                                    padding: '8px 12px', background: '#f8fafc', borderRadius: '8px',
                                                    marginBottom: '6px', fontSize: '0.8125rem', color: '#334155'
                                                }}>
                                                    <input type="checkbox" style={{ accentColor: 'var(--color-primary)' }} />
                                                    {doc}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Tab: Legal References */}
                                    {activeTab === 'legal' && (
                                        <div>
                                            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '12px', color: 'var(--color-primary)' }}>
                                                <Scale size={14} style={{ marginRight: '6px' }} /> Legal References
                                            </h4>
                                            {aiInsights.legalReferences?.map((ref, i) => (
                                                <div key={i} style={{
                                                    padding: '8px 12px', background: '#eff6ff', borderLeft: '3px solid var(--color-primary)',
                                                    borderRadius: '0 8px 8px 0', marginBottom: '8px',
                                                    fontSize: '0.8125rem', color: '#1e40af', fontWeight: 500
                                                }}>
                                                    <BookOpen size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                                    {ref}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Communication / Comments */}
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MessageSquare size={16} /> Comments ({comments.length})
                        </h3>
                        <div className="comments-list" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
                            {comments.map((c, i) => (
                                <div key={i} style={{ padding: '8px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px', fontSize: '0.8125rem' }}>
                                    <div style={{ fontWeight: 600, marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{c.userId?.firstName || 'You'}</span>
                                        {c.userId?.roles && <span style={{ fontSize: '0.625rem', opacity: 0.7 }}>{c.userId.roles[0]}</span>}
                                    </div>
                                    <div>{renderCommentText(c.text)}</div>
                                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                        {new Date(c.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Add a comment..." 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                style={{ fontSize: '0.8125rem' }}
                            />
                            <button className="btn btn-primary btn-sm" disabled={postingComment || !newComment.trim()}>
                                {postingComment ? <Loader size={14} className="spinner" /> : <Send size={14} />}
                            </button>
                        </form>
                    </div>

                    {/* Activity Timeline */}
                    <div style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={16} /> Activity History
                        </h3>
                        {loadingActivities ? <Loader className="spinner" /> : (
                            <div className="timeline">
                                {activities.length === 0 ? <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>No activities recorded.</p> : activities.map(act => (
                                    <div key={act.id} className="timeline-item">
                                        <div className="timeline-dot" style={{ background: act.bg }}>
                                            {act.icon}
                                        </div>
                                        <div className="timeline-content">
                                            <div className="timeline-title">{act.title}</div>
                                            <div className="timeline-sub">{act.sub}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.75rem' }}>
                    <button 
                        className="btn btn-primary" 
                        style={{ flex: 1 }} 
                        onClick={handleDraftResponse}
                        disabled={isDrafting}
                    >
                        <Sparkles size={18} /> {isDrafting ? 'Generating with AI...' : 'Draft Response (AI)'}
                    </button>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleDownload}>
                        <Download size={18} /> Download Notice
                    </button>
                </div>
            </div>

            {/* ── Draft Response Modal ──────────────────── */}
            {showDraftModal && (
                <>
                    <div className="notice-drawer-overlay" style={{ zIndex: 1100 }} onClick={() => setShowDraftModal(false)} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        background: '#fff', borderRadius: '16px', padding: '2rem',
                        width: '90%', maxWidth: '700px', maxHeight: '80vh', overflow: 'auto',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.3)', zIndex: 1200,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>AI-Generated Response</h2>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    Review and edit before sending to Response Studio
                                </p>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowDraftModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{
                            fontFamily: '"Courier New", monospace', fontSize: '0.8125rem',
                            lineHeight: 1.8, padding: '1.5rem', background: '#f8fafc',
                            borderRadius: '12px', border: '1px solid var(--color-border)',
                            whiteSpace: 'pre-wrap', maxHeight: '50vh', overflow: 'auto',
                            color: '#1e293b'
                        }}>
                            {draftText}
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => {
                                navigator.clipboard.writeText(draftText);
                            }}>
                                Copy to Clipboard
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={async () => {
                                    try {
                                        const res = await responsesApi.create({
                                            noticeId: notice._id,
                                            subject: `Reply to Notice ${notice.din || ''}`,
                                            body: draftText.replace(/\n/g, '<br/>') // Basic HTML conversion for Quill
                                        });
                                        setShowDraftModal(false);
                                        navigate(`/responses?noticeId=${notice._id}&responseId=${res.data.data._id}`);
                                    } catch (err) {
                                        alert('Failed to save draft to Response Studio');
                                    }
                                }}
                            >
                                Save to Response Studio
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default NoticeDrawer;
