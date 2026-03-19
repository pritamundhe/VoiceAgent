'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { TrendChart, FillerChart } from '../../components/AnalyticsCharts';
import Link from 'next/link';

export default function AnalyticsPage() {
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
                    <Link href="/practice" className="btn btn-primary">Start Practice</Link>
                </div>
            </div>
        </div>
    );

    return (
        <div className="app-container" style={{ overflowY: 'auto' }}>
            <Navbar />
            
            <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem', paddingBottom: '4rem' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <span className="hero-badge">Your Performance</span>
                    <h1 style={{ fontSize: '3.5rem', fontFamily: 'var(--font-serif)', marginTop: '0.5rem', letterSpacing: '-1px' }}>Analytics Overview</h1>
                    <p style={{ opacity: 0.5, fontSize: '1.1rem', marginTop: '0.5rem' }}>Track your communication growth over {data.totalSessions} sessions.</p>
                </header>

                {/* KPI Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                    <div className="stat-card" style={{ alignItems: 'flex-start', textAlign: 'left', padding: '1.5rem' }}>
                        <span className="stat-label">Total Sessions</span>
                        <span className="stat-value" style={{ fontSize: '2.5rem' }}>{data.totalSessions}</span>
                    </div>
                    <div className="stat-card" style={{ alignItems: 'flex-start', textAlign: 'left', padding: '1.5rem' }}>
                        <span className="stat-label">Avg Fluency</span>
                        <span className="stat-value" style={{ fontSize: '2.5rem', color: data.avgFluency > 80 ? '#69db7c' : 'inherit' }}>{data.avgFluency}%</span>
                    </div>
                    <div className="stat-card" style={{ alignItems: 'flex-start', textAlign: 'left', padding: '1.5rem' }}>
                        <span className="stat-label">Primary Mode</span>
                        <span className="stat-value" style={{ fontSize: '1.5rem', textTransform: 'capitalize' }}>{data.recentSessions[0]?.mode || 'N/A'}</span>
                    </div>
                    <div className="stat-card" style={{ alignItems: 'flex-start', textAlign: 'left', padding: '1.5rem' }}>
                        <span className="stat-label">Total Word Count</span>
                        <span className="stat-value" style={{ fontSize: '2.5rem' }}>{Object.values(data.fillers).reduce((a, b) => a + b, 0)}</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>Fillers tracked</span>
                    </div>
                </div>

                {/* Charts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                    <div className="chart-card" style={{ minHeight: '350px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <span className="stat-label">Fluency Trend</span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Last {data.totalSessions} sessions</span>
                        </div>
                        <div style={{ height: '280px' }}>
                            <TrendChart 
                                data={data.trends.fluency} 
                                labels={data.trends.labels} 
                                label="Fluency Score" 
                                color="#69db7c"
                            />
                        </div>
                    </div>

                    <div className="chart-card" style={{ minHeight: '350px' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <span className="stat-label">Filler word mix</span>
                        </div>
                        <div style={{ height: '250px' }}>
                            <FillerChart data={data.fillers} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
                    <div className="chart-card" style={{ minHeight: '300px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <span className="stat-label">Speaking Pace (WPM)</span>
                        </div>
                        <div style={{ height: '230px' }}>
                            <TrendChart 
                                data={data.trends.wpm} 
                                labels={data.trends.labels} 
                                label="Words Per Minute" 
                                color="#4dabf7"
                            />
                        </div>
                    </div>

                    <div className="chart-card" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                        <span className="stat-label" style={{ marginBottom: '1.5rem' }}>Insights</span>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'var(--surface-2)', borderRadius: '12px', borderLeft: '3px solid #69db7c' }}>
                                <p style={{ fontSize: '0.9rem', marginBottom: '0.3rem', fontWeight: 600 }}>Consistent Progress</p>
                                <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Your fluency has improved by {data.trends.fluency[data.trends.fluency.length - 1] - data.trends.fluency[0] > 0 ? '+' : ''}{data.trends.fluency[data.trends.fluency.length - 1] - data.trends.fluency[0]}% since you started.</p>
                            </div>
                            <div style={{ padding: '1rem', background: 'var(--surface-2)', borderRadius: '12px', borderLeft: '3px solid #4dabf7' }}>
                                <p style={{ fontSize: '0.9rem', marginBottom: '0.3rem', fontWeight: 600 }}>Pace Control</p>
                                <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>On average, you speak at {Math.round(data.trends.wpm.reduce((a,b)=>a+b,0)/data.totalSessions)} WPM, which is within the ideal range.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Table */}
                <section>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 600, fontFamily: 'var(--font-serif)' }}>Recent Sessions</h2>
                    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', minHeight: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>Date</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>Topic</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>Mode</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>Score</th>
                                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>WPM</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentSessions.map((session) => (
                                    <tr key={session._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-row">
                                        <td style={{ padding: '1.2rem 1.5rem', fontSize: '0.9rem' }}>{new Date(session.timestamp).toLocaleDateString()}</td>
                                        <td style={{ padding: '1.2rem 1.5rem', fontWeight: 500 }}>{session.topic || 'General Practice'}</td>
                                        <td style={{ padding: '1.2rem 1.5rem', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                                            <span style={{ padding: '0.2rem 0.6rem', background: 'var(--surface-3)', borderRadius: '12px' }}>{session.mode}</span>
                                        </td>
                                        <td style={{ padding: '1.2rem 1.5rem', fontWeight: 700, color: session.fluencyScore > 80 ? '#69db7c' : 'inherit' }}>{session.fluencyScore}%</td>
                                        <td style={{ padding: '1.2rem 1.5rem', opacity: 0.8 }}>{session.wpm}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
                
                <style jsx>{`
                    .hover-row:hover {
                        background: rgba(255,255,255,0.02);
                    }
                `}</style>
            </main>
        </div>
    );
}
