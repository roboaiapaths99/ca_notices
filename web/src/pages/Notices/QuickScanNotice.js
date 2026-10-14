import React, { useState, useRef } from 'react';
import api from '../../api/axios';
import {
    Upload, FileText, CheckCircle, AlertCircle,
    X, Loader, Search, Calendar, Hash, Tag, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './Notices.css';

const QuickScanNotice = ({ onClose, onSaved }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef();

    // Form state (pre-filled from extracted data)
    const [form, setForm] = useState({
        noticeNumber: '',
        pan: '',
        assessmentYear: '',
        section: '',
        dueDate: '',
        category: 'Income Tax',
        clientId: '',
        clientName: '',
        priority: 'Medium',
        description: 'Auto-extracted from scan'
    });

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            handleScan(selectedFile);
        }
    };

    const handleScan = async (selectedFile) => {
        setScanning(true);
        setError(null);

        const formData = new FormData();
        formData.append('noticeFile', selectedFile);

        try {
            const res = await api.post('/api/notices/quick-scan', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                const data = res.data.data;
                setExtractedData(data);
                setForm(prev => ({
                    ...prev,
                    noticeNumber: data.noticeNumber || '',
                    pan: data.pan || '',
                    assessmentYear: data.assessmentYear || '',
                    section: data.section || '',
                    dueDate: data.dueDate ? formatDateForInput(data.dueDate) : '',
                    category: data.category || 'Income Tax',
                    clientId: data.clientId || '',
                    clientName: data.clientName || ''
                }));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to scan document. Please try manual entry.');
        } finally {
            setScanning(false);
        }
    };

    const formatDateForInput = (dateStr) => {
        // OCR might return DD/MM/YYYY, input type date needs YYYY-MM-DD
        const parts = dateStr.match(/(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})/);
        if (parts) return `${parts[3]}-${parts[2]}-${parts[1]}`;
        return dateStr;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setScanning(true);
        try {
            const payload = {
                din: form.noticeNumber,
                section: form.section,
                assessmentYear: form.assessmentYear,
                dueDate: form.dueDate,
                department: form.category === 'Income Tax' ? 'IncomeTax' :
                    form.category === 'GST' ? 'GST' : 'Other',
                clientId: form.clientId,
                priority: form.priority,
                notes: form.description,
                source: 'OCR',
                extractedFields: extractedData
            };

            const res = await api.post('/api/notices', payload);

            if (res.data.success) {
                alert('✅ Notice saved successfully and linked to client.');
                if (onSaved) onSaved();
                if (onClose) onClose();
            }
        } catch (err) {
            console.error('Save failed:', err);
            alert('Failed to save notice: ' + (err.response?.data?.message || err.message));
        } finally {
            setScanning(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '900px', width: '95%' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><Loader size={20} className={scanning ? 'spin' : ''} /> Quick Scan Notice</h2>
                    <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', minHeight: '500px' }}>

                    {/* Left: Upload & Preview */}
                    <div className="scan-preview-panel" style={{ borderRight: '1px solid var(--border-color)', paddingRight: '1rem' }}>
                        {!file ? (
                            <div className="dropzone" onClick={() => fileInputRef.current.click()}>
                                <Upload size={48} color="var(--color-primary)" />
                                <h3>Upload Notice Scan</h3>
                                <p>Drag & drop or click to upload PDF/Image</p>
                                <span className="text-muted" style={{ fontSize: '12px' }}>Max size 10MB</span>
                            </div>
                        ) : (
                            <div className="file-preview-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <FileText size={32} color="var(--color-primary)" />
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0 }}>{file.name}</h4>
                                        <span className="text-muted" style={{ fontSize: '12px' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setFile(null)}><X size={16} /></button>
                                </div>

                                {scanning && (
                                    <div className="scanning-overlay">
                                        <div className="scanner-line"></div>
                                        <div className="loading-state">
                                            <div className="spinner"></div>
                                            <p>Analyzing document...</p>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Using localized Tesseract OCR engine</span>
                                        </div>
                                    </div>
                                )}

                                {!scanning && extractedData && (
                                    <div className="extraction-summary card" style={{ background: 'var(--bg-secondary)', border: 'none' }}>
                                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                            <CheckCircle size={16} color="var(--color-success)" /> Data Extracted!
                                        </h4>
                                        <p style={{ fontSize: '13px' }}>We found a match for <strong>{extractedData.category}</strong>. Please verify the fields on the right.</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="extraction-error card" style={{ background: '#fff5f5', border: '1px solid #feb2b2', color: '#c53030' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <AlertCircle size={18} />
                                            <div>
                                                <h4 style={{ margin: 0 }}>Scan Interrupted</h4>
                                                <p style={{ fontSize: '12px', margin: '0.25rem 0' }}>{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} hidden accept=".pdf,.jpg,.jpeg,.png" />
                    </div>

                    {/* Right: Validation Form */}
                    <div className="verification-form">
                        <h3 style={{ marginBottom: '1.5rem' }}>Verify & Complete</h3>
                        <form onSubmit={handleSave}>
                            <div className="input-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Hash size={14} /> Notice No. / DIN
                                </label>
                                <input
                                    className={`input ${extractedData?.noticeNumber ? 'extracted' : ''}`}
                                    value={form.noticeNumber}
                                    onChange={e => setForm({ ...form, noticeNumber: e.target.value })}
                                    placeholder="Enter DIN (e.g. ITBA/...)"
                                />
                            </div>

                            <div className="form-row" style={{ marginTop: '1rem' }}>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <User size={14} /> PAN
                                    </label>
                                    <input
                                        className={`input ${extractedData?.pan ? 'extracted' : ''}`}
                                        value={form.pan}
                                        onChange={e => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                                        maxLength={10}
                                    />
                                </div>
                                <div className="input-group" style={{ flex: 1.5 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Search size={14} /> Client Match
                                    </label>
                                    <input
                                        className={`input ${extractedData?.clientId ? 'extracted' : ''}`}
                                        value={form.clientName || 'Manual Entry Required'}
                                        readOnly
                                        style={{ background: 'var(--bg-secondary)', cursor: 'not-allowed' }}
                                    />
                                </div>
                            </div>

                            <div className="form-row" style={{ marginTop: '1rem' }}>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Tag size={14} /> Section
                                    </label>
                                    <input
                                        className={`input ${extractedData?.section ? 'extracted' : ''}`}
                                        value={form.section}
                                        onChange={e => setForm({ ...form, section: e.target.value })}
                                    />
                                </div>
                                <div className="input-group" style={{ flex: 1 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={14} /> Due Date
                                    </label>
                                    <input
                                        type="date"
                                        className={`input ${extractedData?.dueDate ? 'extracted' : ''}`}
                                        value={form.dueDate}
                                        onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={scanning}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={scanning || !file}>
                                    Save Notice
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickScanNotice;
