import React, { useState } from 'react';
import { 
    ChevronLeft, ChevronRight, Calendar as CalIcon, 
    Filter, Download, Search, MoreHorizontal
} from 'lucide-react';

const NoticeCalendar = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

    const monthName = currentMonth.toLocaleString('default', { month: 'long' });
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const days = [];
    const firstDay = firstDayOfMonth(year, month);
    const numDays = daysInMonth(year, month);

    // Padding for start of month
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= numDays; i++) days.push(i);

    const mockEvents = {
        15: { type: 'critical', count: 1, title: 'IT Sec 143(1)' },
        22: { type: 'warning', count: 2, title: 'GST DRC-01' },
        28: { type: 'info', count: 1, title: 'TDS Mismatch' }
    };

    return (
        <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="page-header">
                <div>
                    <h1>Compliance Calendar</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Visualize all upcoming deadlines and filing dates.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary"><Download size={18} /> Export</button>
                    <button className="btn btn-primary"><CalIcon size={18} /> Sync Google</button>
                </div>
            </div>

            <div className="card" style={{ flex: 1, marginTop: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Calendar Header */}
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{monthName} {year}</h2>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="btn btn-ghost btn-xs" onClick={() => setCurrentMonth(new Date(year, month - 1))}><ChevronLeft size={16} /></button>
                            <button className="btn btn-ghost btn-xs" onClick={() => setCurrentMonth(new Date(year, month + 1))}><ChevronRight size={16} /></button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-critical)' }}></div> Critical
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-warning)' }}></div> Pending
                        </div>
                    </div>
                </div>

                {/* Weekdays */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(7, 1fr)', 
                    background: '#f8fafc', 
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase'
                }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} style={{ padding: '0.75rem', textAlign: 'center' }}>{d}</div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(7, 1fr)', 
                    flex: 1,
                    background: 'var(--color-border)' 
                }}>
                    {days.map((day, i) => (
                        <div key={i} style={{ 
                            background: day ? 'white' : '#f8fafc', 
                            padding: '0.75rem', 
                            border: '0.5px solid var(--color-border)',
                            minHeight: '100px',
                            position: 'relative',
                            transition: 'all 0.2s'
                        }}>
                            {day && (
                                <>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: day === new Date().getDate() ? 'var(--color-primary)' : 'inherit' }}>{day}</div>
                                    {mockEvents[day] && (
                                        <div style={{ 
                                            marginTop: '8px', 
                                            padding: '4px 8px', 
                                            borderRadius: '6px', 
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            background: mockEvents[day].type === 'critical' ? 'var(--color-critical-light)' : 'var(--color-warning-light)',
                                            color: mockEvents[day].type === 'critical' ? 'var(--color-critical)' : 'var(--color-warning)',
                                            border: `1px solid ${mockEvents[day].type === 'critical' ? '#fee2e2' : '#fef3c7'}`
                                        }}>
                                            {mockEvents[day].title}
                                        </div>
                                    )}
                                    {mockEvents[day]?.count > 1 && (
                                        <div style={{ 
                                            marginTop: '4px', 
                                            fontSize: '0.6rem', 
                                            color: 'var(--color-text-muted)',
                                            textAlign: 'right'
                                        }}>
                                            +{mockEvents[day].count - 1} more
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NoticeCalendar;
