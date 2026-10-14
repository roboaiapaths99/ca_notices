import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload, Camera, FileText, CheckCircle, AlertTriangle,
    Loader, X, ChevronRight, Sparkles, ArrowRight
} from 'lucide-react';
import { noticesApi } from '../../api/endpoints';
import './Notices.css';

const ScanUpload = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Editable form fields
    const [formData, setFormData] = useState({
        department: 'IncomeTax',
        section: '',
        din: '',
        pan: '',
        assessmentYear: '',
        financialYear: '',
        demandAmount: '',
        dueDate: '',
        notes: '',
        clientName: ''
    });

    const handleFileDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFile = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
        if (droppedFile) {
            processFile(droppedFile);
        }
    };

    const processFile = (f) => {
        setFile(f);
        setError('');
        setScanComplete(false);
        setExtractedData(null);

        // Create preview for images
        if (f.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target.result);
            reader.readAsDataURL(f);
        } else {
            setPreview(null);
        }
    };

    const handleScan = async () => {
        if (!file) return;
        setScanning(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('noticeFile', file);
            const res = await noticesApi.quickScan(fd);
            const data = res.data.data;

            setExtractedData(data);
            setFormData(prev => ({
                ...prev,
                department: data.department || prev.department,
                section: data.section || '',
                din: data.din || '',
                pan: data.pan || '',
                assessmentYear: data.assessmentYear || '',
                financialYear: data.financialYear || '',
                demandAmount: data.demandAmount || '',
                dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
                notes: data.rawText?.substring(0, 500) || '',
                clientName: data.clientName || ''
            }));
            setScanComplete(true);
        } catch (err) {
            console.error('Scan error:', err);
            setError(err.response?.data?.message || 'OCR scan failed. Please try again or enter details manually.');
        } finally {
            setScanning(false);
        }
    };

    const handleSaveNotice = async () => {
        setSaving(true);
        try {
            const payload = {
                department: formData.department,
                section: formData.section,
                din: formData.din,
                assessmentYear: formData.assessmentYear,
                financialYear: formData.financialYear,
                demandAmount: Number(formData.demandAmount) || 0,
                dueDate: formData.dueDate || undefined,
                notes: formData.notes,
                source: 'OCR_Upload',
                status: 'Open',
                priority: Number(formData.demandAmount) > 500000 ? 'High' : 'Medium',
            };

            // If client was identified by PAN, attach clientId
            if (extractedData?.clientId) {
                payload.clientId = extractedData.clientId;
            }

            await noticesApi.create(payload);
            navigate('/notices');
        } catch (err) {
            console.error('Save error:', err);
            setError(err.response?.data?.message || 'Failed to save notice. Please check the fields.');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                        <Camera size={28} style={{ marginRight: '10px', verticalAlign: 'middle', color: 'var(--color-primary)' }} />
                        Scan & Upload Notice
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        Upload a photo or PDF of a notice — AI extracts DIN, PAN, section, demand, and due date automatically.
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: scanComplete ? '1fr 1fr' : '1fr', gap: '2rem' }}>
                {/* Left: Upload & Scan */}
                <div>
                    {!file ? (
                        /* Dropzone */
                        <div
                            className="dropzone"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={handleFileDrop}
                            style={{
                                minHeight: '320px',
                                border: '2px dashed var(--color-primary)',
                                background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
                            }}
                        >
                            <div style={{
                                width: '72px', height: '72px', borderRadius: '50%',
                                background: 'var(--color-primary)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
                            }}>
                                <Upload size={32} color="#fff" />
                            </div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                Drop notice image or PDF here
                            </h3>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                                Supports JPG, PNG, PDF up to 10MB
                            </p>
                            <button className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                Browse Files
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf,.tiff,.bmp"
                                style={{ display: 'none' }}
                                onChange={(e) => processFile(e.target.files[0])}
                            />
                        </div>
                    ) : (
                        /* File Loaded — Preview + Scan */
                        <div className="card" style={{ padding: '1.5rem' }}>
                            {/* File Info Bar */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', marginBottom: '1rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <FileText size={24} color="var(--color-primary)" />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{file.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {(file.size / 1024).toFixed(1)} KB · {file.type}
                                        </div>
                                    </div>
                                </div>
                                <button className="btn btn-ghost btn-sm" onClick={() => {
                                    setFile(null); setPreview(null); setScanComplete(false); setExtractedData(null); setError('');
                                }}>
                                    <X size={16} /> Remove
                                </button>
                            </div>

                            {/* Image Preview */}
                            {preview && (
                                <div style={{
                                    borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem',
                                    border: '1px solid var(--color-border)', maxHeight: '300px', position: 'relative'
                                }}>
                                    <img src={preview} alt="Notice preview" style={{
                                        width: '100%', objectFit: 'contain', maxHeight: '300px'
                                    }} />
                                    {scanning && (
                                        <div className="scanning-overlay" style={{
                                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <div className="scanner-line" />
                                            <div className="loading-state">
                                                <Loader size={32} className="spin" color="var(--color-primary)" />
                                                <p style={{ marginTop: '12px', fontSize: '0.875rem' }}>
                                                    AI is extracting notice details...
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PDF notice — no visual preview */}
                            {!preview && scanning && (
                                <div className="scanning-overlay" style={{ marginBottom: '1rem' }}>
                                    <div className="scanner-line" />
                                    <div className="loading-state">
                                        <Loader size={32} className="spin" />
                                        <p>Extracting text from PDF with OCR...</p>
                                    </div>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div style={{
                                    padding: '12px 16px', background: '#FEF2F2', borderRadius: '10px',
                                    color: '#DC2626', fontSize: '0.8125rem', marginBottom: '1rem',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <AlertTriangle size={16} /> {error}
                                </div>
                            )}

                            {/* Scan CTA */}
                            {!scanComplete && !scanning && (
                                <button
                                    className="btn btn-primary btn-block"
                                    onClick={handleScan}
                                    style={{ padding: '14px', fontSize: '1rem', marginTop: '0.5rem' }}
                                >
                                    <Sparkles size={20} /> Run AI-Powered OCR Scan
                                </button>
                            )}

                            {/* Success message */}
                            {scanComplete && (
                                <div style={{
                                    padding: '12px 16px', background: '#F0FDF4', borderRadius: '10px',
                                    color: '#059669', fontSize: '0.875rem', fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <CheckCircle size={18} /> 
                                    {extractedData?.clientName 
                                        ? `Extracted successfully! Client matched: ${extractedData.clientName}`
                                        : 'Fields extracted successfully! Review and save →'
                                    }
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Extracted Data Review Form */}
                {scanComplete && (
                    <div className="card extracted" style={{ padding: '1.5rem' }}>
                        <h3 style={{
                            fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <CheckCircle size={18} color="var(--color-success)" /> Review Extracted Data
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Department</label>
                                <select
                                    className="form-control"
                                    value={formData.department}
                                    onChange={(e) => updateField('department', e.target.value)}
                                >
                                    <option value="IncomeTax">Income Tax</option>
                                    <option value="GST">GST</option>
                                    <option value="TDS">TDS/TCS</option>
                                    <option value="CustomsDuty">Customs</option>
                                    <option value="ROC">ROC/MCA</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Section</label>
                                <input
                                    className="form-control"
                                    value={formData.section}
                                    onChange={(e) => updateField('section', e.target.value)}
                                    placeholder="e.g. 143(1)"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">DIN Number</label>
                                <input
                                    className="form-control"
                                    value={formData.din}
                                    onChange={(e) => updateField('din', e.target.value)}
                                    placeholder="Document ID Number"
                                    style={{ fontFamily: 'var(--font-mono)' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">PAN</label>
                                <input
                                    className="form-control"
                                    value={formData.pan}
                                    onChange={(e) => updateField('pan', e.target.value.toUpperCase())}
                                    placeholder="ABCDE1234F"
                                    style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Assessment Year</label>
                                <input
                                    className="form-control"
                                    value={formData.assessmentYear}
                                    onChange={(e) => updateField('assessmentYear', e.target.value)}
                                    placeholder="2024-25"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Financial Year</label>
                                <input
                                    className="form-control"
                                    value={formData.financialYear}
                                    onChange={(e) => updateField('financialYear', e.target.value)}
                                    placeholder="2023-24"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Demand Amount (₹)</label>
                                <input
                                    className="form-control"
                                    type="number"
                                    value={formData.demandAmount}
                                    onChange={(e) => updateField('demandAmount', e.target.value)}
                                    placeholder="0"
                                    style={{ fontWeight: 700, color: 'var(--color-critical)' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Due Date</label>
                                <input
                                    className="form-control"
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => updateField('dueDate', e.target.value)}
                                />
                            </div>
                        </div>

                        {formData.clientName && (
                            <div style={{
                                marginTop: '1rem', padding: '10px 14px',
                                background: '#eff6ff', borderRadius: '8px',
                                fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                <CheckCircle size={14} /> Client auto-matched: {formData.clientName}
                            </div>
                        )}

                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label className="form-label">OCR Raw Text (for reference)</label>
                            <textarea
                                className="form-control"
                                value={formData.notes}
                                onChange={(e) => updateField('notes', e.target.value)}
                                rows={3}
                                style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
                            />
                        </div>

                        {error && (
                            <div style={{
                                marginTop: '1rem', padding: '10px', background: '#FEF2F2',
                                borderRadius: '8px', color: '#DC2626', fontSize: '0.8125rem'
                            }}>
                                <AlertTriangle size={14} style={{ marginRight: '6px' }} />{error}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '12px' }}
                                onClick={handleSaveNotice}
                                disabled={saving}
                            >
                                {saving
                                    ? <><Loader size={16} className="spinner" /> Saving...</>
                                    : <><ArrowRight size={16} /> Create Notice & Go to Inbox</>
                                }
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScanUpload;
