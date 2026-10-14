import React, { useState, useEffect } from 'react';
import { 
    Bell, Mail, MessageSquare, Shield, Globe, 
    Lock, Save, RefreshCw, Key, Smartphone, Plus
} from 'lucide-react';
import { noticesApi } from '../../api/endpoints';

const AlertSettings = () => {
    const [notifications, setNotifications] = useState({
        email: true,
        whatsapp: false,
        slack: false,
        sms: true,
        deadlineReminders: true,
        newNoticeAlerts: true
    });

    const [portals, setPortals] = useState([
        { name: 'Income Tax Portal', status: 'Synced', lastSync: '2h ago', username: 'AM34P9901' },
        { name: 'GST Portal (GSTN)', status: 'Error', lastSync: '1d ago', username: '27AABCV1234' }
    ]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await noticesApi.getSettings();
                if (res.data.success) {
                    const { channels, triggers } = res.data.data;
                    setNotifications({
                        email: channels.email,
                        whatsapp: channels.whatsapp,
                        slack: channels.slack,
                        sms: channels.sms,
                        deadlineReminders: triggers.deadlineProximity,
                        newNoticeAlerts: triggers.newNotice
                    });
                }
            } catch (err) {
                console.error('Failed to fetch settings', err);
            }
        };
        fetchSettings();
    }, []);

    const toggleNotif = async (key) => {
        const newNotifs = { ...notifications, [key]: !notifications[key] };
        setNotifications(newNotifs);
        try {
            await noticesApi.updateSettings({
                channels: {
                    email: newNotifs.email,
                    whatsapp: newNotifs.whatsapp,
                    slack: newNotifs.slack,
                    sms: newNotifs.sms
                },
                triggers: {
                    newNotice: newNotifs.newNoticeAlerts,
                    deadlineProximity: newNotifs.deadlineReminders
                }
            });
        } catch (err) {
            console.error('Failed to update settings', err);
            setNotifications(notifications); // revert
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="page-header">
                <div>
                    <h1>Alert Configuration</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Manage how and when you get notified about new notices.</p>
                </div>
                <button className="btn btn-primary">
                    <Save size={18} /> Save Changes
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                {/* Notification Channels */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bell size={20} color="var(--color-primary)" /> Notification Channels
                    </h3>
                    
                    <div className="settings-list">
                        <div style={settingItemStyle}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={iconBoxStyle}><Mail size={20} /></div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>Email Notifications</div>
                                    <div style={subTextStyle}>Receive detailed alerts on registered email</div>
                                </div>
                            </div>
                            <input type="checkbox" checked={notifications.email} onChange={() => toggleNotif('email')} />
                        </div>

                        <div style={settingItemStyle}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ ...iconBoxStyle, color: '#25D366', background: '#e6f9ed' }}><MessageSquare size={20} /></div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>WhatsApp Dashboard</div>
                                    <div style={subTextStyle}>Instant alerts & PDFs on your team WhatsApp</div>
                                </div>
                            </div>
                            <input type="checkbox" checked={notifications.whatsapp} onChange={() => toggleNotif('whatsapp')} />
                        </div>

                        <div style={settingItemStyle}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ ...iconBoxStyle, color: '#4A154B', background: '#f5ebf5' }}><Smartphone size={20} /></div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>SMS Alerts</div>
                                    <div style={subTextStyle}>Crucial deadline reminders via SMS</div>
                                </div>
                            </div>
                            <input type="checkbox" checked={notifications.sms} onChange={() => toggleNotif('sms')} />
                        </div>
                    </div>

                    <hr style={{ margin: '2rem 0', borderColor: 'var(--color-border)' }} />

                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Alert Triggers</h3>
                    <div style={settingItemStyle}>
                        <div>
                            <div style={{ fontWeight: 600 }}>New Notice Detection</div>
                            <div style={subTextStyle}>Trigger alert immediately when a new notice is detected</div>
                        </div>
                        <input type="checkbox" checked={notifications.newNoticeAlerts} onChange={() => toggleNotif('newNoticeAlerts')} />
                    </div>
                    <div style={settingItemStyle}>
                        <div>
                            <div style={{ fontWeight: 600 }}>Deadline Proximity</div>
                            <div style={subTextStyle}>Alert 7, 3 and 1 day before due date</div>
                        </div>
                        <input type="checkbox" checked={notifications.deadlineReminders} onChange={() => toggleNotif('deadlineReminders')} />
                    </div>
                </div>

                {/* Portal Syncing */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Globe size={20} color="var(--color-success)" /> Portal Credentials
                        </h3>
                        <p style={subTextStyle}>Securely sync with government portals for automated notice harvesting.</p>
                        
                        <div style={{ marginTop: '1.5rem' }}>
                            {portals.map((p, i) => (
                                <div key={i} style={{ 
                                    padding: '1rem', 
                                    background: '#f8fafc', 
                                    borderRadius: '10px', 
                                    marginBottom: '0.75rem',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{p.name}</span>
                                        <span style={{ 
                                            fontSize: '0.65rem', 
                                            padding: '2px 8px', 
                                            borderRadius: '10px',
                                            background: p.status === 'Synced' ? 'var(--color-success-light)' : 'var(--color-critical-light)',
                                            color: p.status === 'Synced' ? 'var(--color-success)' : 'var(--color-critical)',
                                            fontWeight: 700
                                        }}>{p.status}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>User: {p.username}</span>
                                        <button className="btn btn-ghost btn-xs" style={{ padding: '2px' }}><RefreshCw size={12} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="btn btn-secondary btn-block" style={{ marginTop: '1rem' }}>
                            <Plus size={16} /> Add Portal
                        </button>
                    </div>

                    <div className="card" style={{ padding: '1.5rem', background: 'var(--color-primary)', color: 'white' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Shield size={24} />
                            <div>
                                <h4 style={{ fontWeight: 700 }}>End-to-End Encryption</h4>
                                <p style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '4px' }}>
                                    Your portal credentials are encrypted using AES-256 and never stored in plain text.
                                </p>
                                <button style={{ 
                                    marginTop: '12px', 
                                    background: 'rgba(255,255,255,0.2)', 
                                    border: 'none', 
                                    color: 'white', 
                                    padding: '4px 12px', 
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer'
                                }}>Security Policy</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const settingItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 0',
    borderBottom: '1px solid #f1f5f9'
};

const iconBoxStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: '#ebf0ff',
    color: 'var(--color-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const subTextStyle = {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    marginTop: '2px'
};

export default AlertSettings;
