import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
    Upload, FileText, CheckCircle, AlertTriangle,
    Clock, Loader, Shield
} from 'lucide-react';
import { portalApi } from '../../api/endpoints';

/**
 * PUBLIC page — no login required.
 * Clients access via /portal/:token to upload requested documents.
 */
const ClientUploadPage = () => {
    const { token } = useParams();
    const [portal, setPortal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState({});
    const fileRefs = useRef({});

    useEffect(() => {
        fetchPortal();
    }, [token]);

    const fetchPortal = async () => {
        try {
            const res = await portalApi.getPortal(token);
            setPortal(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'This link is invalid or has expired.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (docIndex, file) => {
        setUploading(prev => ({ ...prev, [docIndex]: true }));
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await portalApi.uploadDocument(token, docIndex, fd);
            // Update local state
            setPortal(prev => {
                const updated = { ...prev };
                updated.requestedDocs = [...updated.requestedDocs];
                updated.requestedDocs[docIndex] = {
                    ...updated.requestedDocs[docIndex],
                    uploadedFile: res.data.data.uploadedDoc.uploadedFile
                };
                updated.status = res.data.data.status;
                return updated;
            });
        } catch (err) {
            console.error('Upload failed', err);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(prev => ({ ...prev, [docIndex]: false }));
        }
    };

    if (loading) {
        return (
            <div style={pageStyle}>
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <Loader size={40} className="spin" color="#2563eb" />
                    <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading upload portal...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={pageStyle}>
                <div style={cardStyle}>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <AlertTriangle size={48} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
                        <h2 style={{ fontWeight: 700, color: '#dc2626', marginBottom: '0.5rem' }}>Link Expired or Invalid</h2>
                        <p style={{ color: '#64748b' }}>{error}</p>
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '1rem' }}>
                            Please contact your Chartered Accountant for a new link.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const allDone = portal.requestedDocs.every(d => d.uploadedFile?.filename);

    return (
        <div style={pageStyle}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: '#2563eb', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto 1rem',
                    boxShadow: '0 4px 14px rgba(37,99,235,0.3)'
                }}>
                    <FileText size={28} color="#fff" />
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                    Document Upload Portal
                </h1>
                <p style={{ color: '#64748b', marginTop: '4px' }}>
                    {portal.clientName && `Hello ${portal.clientName}! `}Your CA has requested the following documents.
                </p>
            </div>

            {/* Message from CA */}
            {portal.message && (
                <div style={{
                    ...cardStyle, background: '#eff6ff', border: '1px solid #bfdbfe',
                    padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#1e40af'
                }}>
                    <strong>Message from your CA:</strong>
                    <p style={{ marginTop: '4px' }}>{portal.message}</p>
                </div>
            )}

            {/* Expiry notice */}
            {portal.expiresAt && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    color: '#ea580c', fontSize: '0.8rem', marginBottom: '1rem', justifyContent: 'center'
                }}>
                    <Clock size={14} />
                    Link expires: {new Date(portal.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
            )}

            {/* All done banner */}
            {allDone && (
                <div style={{
                    ...cardStyle, background: '#f0fdf4', border: '1px solid #bbf7d0',
                    padding: '1.25rem', textAlign: 'center', marginBottom: '1.5rem'
                }}>
                    <CheckCircle size={32} color="#059669" style={{ margin: '0 auto 0.5rem' }} />
                    <h3 style={{ color: '#059669', fontWeight: 700 }}>All documents uploaded!</h3>
                    <p style={{ color: '#065f46', fontSize: '0.85rem', marginTop: '4px' }}>
                        Your CA has been notified. You may close this page.
                    </p>
                </div>
            )}

            {/* Document List */}
            <div style={cardStyle}>
                {portal.requestedDocs.map((doc, i) => {
                    const isUploaded = !!doc.uploadedFile?.filename;
                    return (
                        <div key={i} style={{
                            padding: '1.25rem', borderBottom: i < portal.requestedDocs.length - 1 ? '1px solid #f1f5f9' : 'none',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            gap: '1rem', flexWrap: 'wrap'
                        }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{
                                    fontWeight: 600, fontSize: '0.9375rem',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    {isUploaded
                                        ? <CheckCircle size={18} color="#059669" />
                                        : <FileText size={18} color="#94a3b8" />
                                    }
                                    {doc.label}
                                    {doc.required && (
                                        <span style={{
                                            fontSize: '0.6rem', background: '#fef2f2', color: '#dc2626',
                                            padding: '1px 6px', borderRadius: '4px', fontWeight: 700
                                        }}>REQUIRED</span>
                                    )}
                                </div>
                                {doc.description && (
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{doc.description}</p>
                                )}
                                {isUploaded && (
                                    <div style={{
                                        fontSize: '0.7rem', color: '#059669', marginTop: '4px',
                                        display: 'flex', alignItems: 'center', gap: '4px'
                                    }}>
                                        <CheckCircle size={12} />
                                        Uploaded: {doc.uploadedFile.originalName} ({(doc.uploadedFile.size / 1024).toFixed(1)} KB)
                                    </div>
                                )}
                            </div>

                            <div>
                                {uploading[i] ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb' }}>
                                        <Loader size={16} className="spin" /> Uploading...
                                    </div>
                                ) : isUploaded ? (
                                    <button
                                        onClick={() => fileRefs.current[i]?.click()}
                                        style={{
                                            ...btnStyle, background: '#f1f5f9', color: '#64748b'
                                        }}
                                    >
                                        Replace
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => fileRefs.current[i]?.click()}
                                        style={{
                                            ...btnStyle, background: '#2563eb', color: '#fff'
                                        }}
                                    >
                                        <Upload size={14} /> Upload
                                    </button>
                                )}
                                <input
                                    ref={el => fileRefs.current[i] = el}
                                    type="file"
                                    style={{ display: 'none' }}
                                    accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx,.csv"
                                    onChange={(e) => {
                                        if (e.target.files[0]) handleUpload(i, e.target.files[0]);
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Security footer */}
            <div style={{
                textAlign: 'center', marginTop: '2rem', fontSize: '0.7rem', color: '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}>
                <Shield size={12} /> Secured by NoticeRadar · End-to-end encrypted
            </div>
        </div>
    );
};

const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
    padding: '2.5rem 1rem',
    maxWidth: '640px',
    margin: '0 auto',
    fontFamily: "'Inter', -apple-system, sans-serif"
};

const cardStyle = {
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden'
};

const btnStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
};

export default ClientUploadPage;
