'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { FILLER_WORDS } from '../../lib/analytics';

export default function SessionReport() {
    const [report, setReport] = useState(null);

    useEffect(() => {
        console.log('[SessionReport] Component mounted.');
        try {
            const data = localStorage.getItem('lastSessionReport');
            if (data) {
                console.log('[SessionReport] Data found in localStorage.');
                setReport(JSON.parse(data));
            } else {
                console.warn('[SessionReport] No data found in localStorage.');
            }
        } catch (err) {
            console.error('[SessionReport] Error reading from localStorage:', err);
        }
    }, []);

    if (!report) {
        return (
            <div className="app-container">
                <Navbar />
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <p>No session report found. Try recording something first!</p>
                </div>
            </div>
        );
    }

    const { metrics, aiAnalysis, transcript, modeTitle, timestamp } = report;

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const renderTranscript = () => {
        const words = transcript.split(/\s+/);
        return words.map((word, i) => {
            const clean = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
            const isFiller = FILLER_WORDS.includes(clean);
            return (
                <span key={i} style={{ 
                    marginRight: '0.4rem', 
                    background: isFiller ? 'rgba(255, 75, 75, 0.2)' : 'transparent',
                    color: isFiller ? '#ff6b6b' : 'inherit',
                    padding: isFiller ? '0 2px' : '0',
                    borderRadius: '4px',
                    fontWeight: isFiller ? 600 : 400
                }}>
                    {word}
                </span>
            );
        });
    };

    return (
        <div className="app-container" style={{ overflowY: 'auto' }}>
            <Navbar />
            
            <main style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem', paddingBottom: '4rem' }}>
                <header style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                        <div>
                            <span className="hero-badge">{modeTitle} Session</span>
                            <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', marginTop: '0.5rem' }}>Session Analysis</h1>
                            <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>Recorded on {new Date(timestamp).toLocaleString()}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '4rem', fontWeight: 300, lineHeight: 1, letterSpacing: '-2px' }}>{metrics.fluencyScore}</div>
                            <div className="stat-label">Fluency Score</div>
                        </div>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                    <div className="stat-card">
                        <span className="stat-label">Total Words</span>
                        <span className="stat-value">{metrics.totalWords}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Duration</span>
                        <span className="stat-value">{formatDuration(metrics.duration)}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Avg Pace (WPM)</span>
                        <span className="stat-value">{metrics.wpm}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Fillers</span>
                        <span className="stat-value" style={{ color: metrics.totalFillers > 5 ? '#ff6b6b' : 'inherit' }}>{metrics.totalFillers}</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem', marginBottom: '4rem' }}>
                    <section>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>AI Feedback</h2>
                        <div className="glass-panel" style={{ padding: '2rem', minHeight: 'auto' }}>
                            <div style={{ marginBottom: '2rem' }}>
                                <span className="stat-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Topic</span>
                                <div style={{ fontSize: '1.2rem', fontWeight: 500 }}>{aiAnalysis.topic}</div>
                            </div>
                            
                            <div style={{ marginBottom: '2rem' }}>
                                <span className="stat-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Performance Summary</span>
                                <p style={{ fontSize: '1.05rem', lineHeight: 1.6, opacity: 0.9 }}>{aiAnalysis.feedback}</p>
                            </div>

                            <div>
                                <span className="stat-label" style={{ display: 'block', marginBottom: '1rem' }}>Suggestions for improvement</span>
                                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {aiAnalysis.suggestions.map((s, i) => (
                                        <li key={i} style={{ 
                                            padding: '0.8rem 1rem', 
                                            background: 'var(--surface-2)', 
                                            borderRadius: '8px',
                                            borderLeft: '3px solid var(--accent)',
                                            fontSize: '0.95rem'
                                        }}>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                    <aside>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>Deep Metrics</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="glass-panel" style={{ padding: '1.25rem', minHeight: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="stat-label">Unique Words</span>
                                <span style={{ fontWeight: 600 }}>{metrics.uniqueWords}</span>
                            </div>
                            <div className="glass-panel" style={{ padding: '1.25rem', minHeight: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="stat-label">Vocab Richness</span>
                                <span style={{ fontWeight: 600 }}>{metrics.vocabRichness}</span>
                            </div>
                            <div className="glass-panel" style={{ padding: '1.25rem', minHeight: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="stat-label">Repeated Phrases</span>
                                <span style={{ fontWeight: 600 }}>{metrics.repeatedWordsCount}</span>
                            </div>
                            <div className="glass-panel" style={{ padding: '1.25rem', minHeight: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="stat-label">Confidence (AI)</span>
                                <span style={{ fontWeight: 600, color: aiAnalysis.confidenceScore > 80 ? '#69db7c' : 'inherit' }}>{aiAnalysis.confidenceScore}%</span>
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '2rem' }}>
                            <Link href="/practice" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', textDecoration: 'none' }}>
                                New Session
                            </Link>
                        </div>
                    </aside>
                </div>

                <section>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>Annotated Transcript</h2>
                    <div className="glass-panel" style={{ padding: '2.5rem', lineHeight: 2, fontSize: '1.15rem', color: 'rgba(255,255,255,0.8)' }}>
                        {renderTranscript()}
                    </div>
                </section>
            </main>
        </div>
    );
}
