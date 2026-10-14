import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { Settings as SettingsIcon, Building, Bell, Shield, Globe } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import './Admin.css';

const OrgSettings = () => {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState({
        orgName: 'My CA Firm',
        orgEmail: 'admin@firm.com',
        orgPhone: '',
        orgGSTIN: '',
        orgAddress: '',
        deadlineReminder: true,
        dailySummary: true,
        emailNotifications: true,
        inAppNotifications: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        twoFactorRequired: false,
        ipWhitelistStr: '', // Comma separated IPs
        defaultTimezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        financialYearStart: 'April',
    });

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await adminApi.getSettings();
                const data = res.data.data || {};
                
                setSettings(prev => ({
                    ...prev,
                    orgName: data.branding?.firmName || prev.orgName,
                    defaultTimezone: data.timezone || prev.defaultTimezone,
                    ipWhitelistStr: data.security?.ipWhitelist?.join(', ') || '',
                    twoFactorRequired: data.security?.requireMfa || false,
                }));
            } catch (error) {
                console.error('Failed to load settings', error);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const ipWhitelist = settings.ipWhitelistStr
                .split(',')
                .map(ip => ip.trim())
                .filter(ip => ip.length > 0);

            await adminApi.updateSettings({
                branding: { firmName: settings.orgName },
                timezone: settings.defaultTimezone,
                security: { 
                    ipWhitelist,
                    requireMfa: settings.twoFactorRequired
                }
            });
            alert('Settings saved successfully!');
        } catch (error) {
            alert('Failed to save settings: ' + (error.response?.data?.message || error.message));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1>Settings</h1>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving && <div className="spinner"></div>}
                    Save Settings
                </button>
            </div>

            {/* Organization */}
            <div className="settings-section">
                <h3><Building size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Organization</h3>
                <div className="card">
                    <div className="settings-grid">
                        <div className="input-group">
                            <label>Organization Name</label>
                            <input className="input" value={settings.orgName} onChange={(e) => handleChange('orgName', e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Email</label>
                            <input className="input" type="email" value={settings.orgEmail} onChange={(e) => handleChange('orgEmail', e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Phone</label>
                            <input className="input" value={settings.orgPhone} onChange={(e) => handleChange('orgPhone', e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>GSTIN</label>
                            <input className="input" value={settings.orgGSTIN} onChange={(e) => handleChange('orgGSTIN', e.target.value)} placeholder="22AAAAA0000A1Z5" />
                        </div>
                    </div>
                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label>Address</label>
                        <textarea className="input" rows={2} value={settings.orgAddress} onChange={(e) => handleChange('orgAddress', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="settings-section">
                <h3><Bell size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Notifications</h3>
                <div className="card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <strong>Deadline Reminders</strong>
                                <span>Send email reminders for upcoming deadlines</span>
                            </div>
                            <button className={`toggle-switch ${settings.deadlineReminder ? 'active' : ''}`} onClick={() => handleChange('deadlineReminder', !settings.deadlineReminder)} />
                        </div>
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <strong>Daily Summary</strong>
                                <span>Send daily summary to Partners & Admins</span>
                            </div>
                            <button className={`toggle-switch ${settings.dailySummary ? 'active' : ''}`} onClick={() => handleChange('dailySummary', !settings.dailySummary)} />
                        </div>
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <strong>Email Notifications</strong>
                                <span>Enable email notifications for all users</span>
                            </div>
                            <button className={`toggle-switch ${settings.emailNotifications ? 'active' : ''}`} onClick={() => handleChange('emailNotifications', !settings.emailNotifications)} />
                        </div>
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <strong>In-App Notifications</strong>
                                <span>Show notification bell in the topbar</span>
                            </div>
                            <button className={`toggle-switch ${settings.inAppNotifications ? 'active' : ''}`} onClick={() => handleChange('inAppNotifications', !settings.inAppNotifications)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Security */}
            <div className="settings-section">
                <h3><Shield size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Security</h3>
                <div className="card">
                    <div className="settings-grid">
                        <div className="input-group">
                            <label>Session Timeout (minutes)</label>
                            <input className="input" type="number" value={settings.sessionTimeout} onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))} min={5} max={480} />
                        </div>
                        <div className="input-group">
                            <label>Max Login Attempts</label>
                            <input className="input" type="number" value={settings.maxLoginAttempts} onChange={(e) => handleChange('maxLoginAttempts', parseInt(e.target.value))} min={3} max={20} />
                        </div>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <div className="settings-item">
                            <div className="settings-item-label">
                                <strong>Two-Factor Authentication</strong>
                                <span>Require 2FA for all users (Keycloak integration)</span>
                            </div>
                            <button className={`toggle-switch ${settings.twoFactorRequired ? 'active' : ''}`} onClick={() => handleChange('twoFactorRequired', !settings.twoFactorRequired)} />
                        </div>
                        <div className="settings-item" style={{ marginTop: '1rem', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div className="settings-item-label" style={{ marginBottom: '0.5rem' }}>
                                <strong>IP Whitelist (Comma separated)</strong>
                                <span>Leave empty to allow all IP addresses. If set, ONLY these IPs can access the API.</span>
                            </div>
                            <input 
                                className="input" 
                                style={{ width: '100%' }}
                                placeholder="e.g. 192.168.1.1, 203.0.113.50" 
                                value={settings.ipWhitelistStr} 
                                onChange={(e) => handleChange('ipWhitelistStr', e.target.value)} 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Regional */}
            <div className="settings-section">
                <h3><Globe size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Regional</h3>
                <div className="card">
                    <div className="settings-grid">
                        <div className="input-group">
                            <label>Timezone</label>
                            <select className="input select" value={settings.defaultTimezone} onChange={(e) => handleChange('defaultTimezone', e.target.value)}>
                                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                                <option value="America/New_York">America/New_York (EST)</option>
                                <option value="Europe/London">Europe/London (GMT)</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Date Format</label>
                            <select className="input select" value={settings.dateFormat} onChange={(e) => handleChange('dateFormat', e.target.value)}>
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Financial Year Starts</label>
                            <select className="input select" value={settings.financialYearStart} onChange={(e) => handleChange('financialYearStart', e.target.value)}>
                                <option value="April">April (India)</option>
                                <option value="January">January</option>
                                <option value="July">July</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrgSettings;
