'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { TrendChart, FillerChart, CircularProgress } from '../../components/AnalyticsCharts';
import Link from 'next/link';

export default function AnalyticsDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/api/analytics')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch analytics');
                return res.json();
            })
            .then(data => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) return (
        <div className="app-container">
            <Navbar />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className="loader-ring"></div>
            </div>
        </div>
    );

    if (error) return (
        <div className="app-container">
            <Navbar />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', textAlign: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Please Sign In</h1>
                    <p style={{ opacity: 0.6, marginBottom: '2rem' }}>You need to be authenticated to view your personal analytics.</p>
                    <Link href="/auth/signin" className="btn btn-primary">Sign In</Link>
                </div>
            </div>
        </div>
    );

    if (data.totalSessions === 0) return (
        <div className="app-container">
            <Navbar />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', textAlign: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>No Sessions Yet</h1>
                    <p style={{ opacity: 0.6, marginBottom: '2rem' }}>Complete your first practice session to see insights here.</p>
                    <Link href="/dashboard" className="btn btn-primary">Start Practice</Link>
                </div>
            </div>
        </div>
    );

    // Mock calculations for metrics to match screenshot style
    const totalFilled = Object.values(data.fillers).reduce((a, b) => a + b, 0);
    const totalWords = data.totalSessions * (data.avgWpm || 100) * 2; // Approximated
    const fillerPercentage = totalWords > 0 ? ((totalFilled / totalWords) * 100).toFixed(1) : 0;
    
    // Pace Score calculation
    const paceScore = Math.min(100, Math.max(0, 100 - Math.abs(130 - data.avgWpm))); // Ideal around 130WPM
    const consistencyScore = data.totalSessions ? Math.min(100, data.totalSessions * 5).toFixed(0) : 0;

    return (
        <div className="app-container" style={{ overflowY: 'auto' }}>
            <Navbar />
            
            <main style={{ padding: '2rem 1.5rem', maxWidth: '1400px', margin: '0 auto', paddingBottom: '6rem' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <h1 style={{ fontSize: '1.8rem', color: '#3b82f6', fontWeight: 700, margin: 0 }}>Project Controlling (Speech Dashboard)</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ background: 'var(--surface-2)', padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            This Year ▾
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current date: {new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}</span>
                    </div>
                </header>

                {/* Top Half */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) minmax(300px, 1.5fr) minmax(300px, 1.4fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    
                    {/* Details Panel */}
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text)' }}>Details</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>User Name</span>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.8rem', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 600 }}>{data.user?.name || 'Voice User'}</div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Rank</span>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>{data.user?.rank || 'Newbie'}</div>
                                </div>
                                <div style={{ flex: 1, textAlign: 'right' }}>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Total XP Earned</span>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>{data.user?.xp || 0} XP</div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                <div>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Primary Mode</span>
                                    <div style={{ display: 'inline-block', background: '#3b82f6', color: '#fff', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
                                        {data.mostUsedMode || 'General'}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Status</span>
                                    <div style={{ display: 'inline-block', background: '#69db7c', color: '#000', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                                        Active
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '0.5rem' }}>
                                <div>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Joined Date</span>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{data.user?.joined ? new Date(data.user.joined).toLocaleDateString('en-GB').replace(/\//g, '.') : 'N/A'}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Total Sessions</span>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{data.totalSessions}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Panel */}
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text)' }}>Metrics</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem 1.5rem' }}>
                            
                            {/* Budget mapped to Total Words Spoken */}
                            <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Est. Words Spoken</span>
                                <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text)' }}>~{totalWords}</div>
                            </div>

                            {/* Actual Cost mapped to Total Sessions */}
                            <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Completed Sessions</span>
                                <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text)' }}>{data.totalSessions}</div>
                            </div>

                            {/* Work Scheduled mapped to Avg Fluency */}
                            <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Average Fluency</span>
                                <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text)' }}>{data.avgFluency}%</div>
                            </div>

                            {/* Margin mapped to Avg WPM */}
                            <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Average Pace (WPM)</span>
                                <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text)' }}>{data.avgWpm}</div>
                            </div>

                            {/* Work Performed mapped to Total Fillers */}
                            <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Total Filler Words</span>
                                <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text)' }}>{totalFilled}</div>
                            </div>

                            {/* Margin % mapped to Filler Ratio */}
                            <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Filler Ratio</span>
                                <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text)' }}>{fillerPercentage}%</div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Panel */}
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text)' }}>Progress</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            
                            {/* Completion (Fluency) */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <CircularProgress value={data.avgFluency} max={100} size={110} strokeWidth={9} color="#3b82f6" label="Fluency" />
                                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Peak Fluency</span>
                                    <span style={{ fontSize: '1rem', fontWeight: 600 }}>{Math.max(...(data.trends.fluency), 0)}%</span>
                                </div>
                            </div>

                            {/* SPI (Pace Health) */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <CircularProgress value={paceScore.toFixed(0)} max={100} size={110} strokeWidth={9} color="#69db7c" label="Pace Health" />
                                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Pace Variance</span>
                                    <span style={{ fontSize: '1rem', fontWeight: 600 }}>Avg {data.avgWpm}</span>
                                </div>
                            </div>

                            {/* CPI (Consistency) */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <CircularProgress value={consistencyScore} max={100} size={110} strokeWidth={9} color="#69db7c" label="Consistency" />
                                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Practice Volume</span>
                                    <span style={{ fontSize: '1rem', fontWeight: 600 }}>{(data.totalSessions * 2.5).toFixed(1)}m</span>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

                {/* Bottom Half */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.3fr) minmax(300px, 1fr)', gap: '1.5rem' }}>
                    
                    {/* Line Chart Panel */}
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text)' }}>Performance & Pace Development</h3>
                        
                        <div style={{ flex: 1, marginTop: '2rem', height: '100%', minHeight: '300px' }}>
                            <TrendChart 
                                labels={data.trends.labels}
                                datasets={[
                                    { label: 'Fluency', data: data.trends.fluency, borderColor: '#3b82f6', backgroundColor: '#3b82f6' },
                                    { label: 'Words Per Min', data: data.trends.wpm, borderColor: '#eab308', backgroundColor: '#eab308' },
                                    { label: 'Target Fluency (85%)', data: data.trends.fluency.map(() => 85), borderColor: '#ef4444', backgroundColor: '#ef4444', borderDash: [5, 5], borderWidth: 1 }
                                ]}
                            />
                        </div>
                    </div>

                    {/* Donut Chart & Horizontal Bars Panel */}
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', minHeight: '380px' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '2rem', color: 'var(--text)' }}>Filler Word Breakdown</h3>
                        
                        {Object.keys(data.fillers).length === 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '250px', opacity: 0.5 }}>
                                No filler words recorded yet.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', height: '300px' }}>
                                
                                {/* Donut Left */}
                                <div style={{ flex: '0 0 55%', height: '100%', position: 'relative' }}>
                                    <FillerChart data={data.fillers} />
                                </div>

                                {/* Horizontal Bars Right */}
                                <div style={{ flex: '0 0 45%', display: 'flex', flexDirection: 'column', gap: '0.8rem', justifyContent: 'center', height: '100%' }}>
                                    {Object.entries(data.fillers).sort((a,b)=>b[1]-a[1]).slice(0, 5).map(([word, count], idx) => {
                                        const colors = ['#69db7c', '#4dabf7', '#ff6b6b', '#adb5bd', '#fcc419'];
                                        const color = colors[idx % colors.length];

                                        return (
                                            <div key={word} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, width: '70px', textTransform: 'capitalize' }}>
                                                    {word}
                                                </span>
                                                <div style={{ flex: 1, backgroundColor: color, color: '#fff', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', textAlign: 'right' }}>
                                                    {count}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
