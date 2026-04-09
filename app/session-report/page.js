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

    const renderRepeatResults = (results) => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {results.map((res, i) => {
                    const isShortQuiz = !!res.isShortQuiz;
                    const isFitb = !!res.isFitb;
                    const spokenClean = (res.spoken || '').toLowerCase().replace(/[^\w\s]/g, '').trim();
                    const expectedClean = (res.expected || res.target).toLowerCase().replace(/[^\w\s]/g, '').trim();
                    
                    // Prioritize AI verification if available
                    let isCorrect = (isShortQuiz || isFitb) ? spokenClean.includes(expectedClean) : (spokenClean === expectedClean);
                    if (res.aiVerification) isCorrect = res.aiVerification.correct;
                    
                    let label = `Sentence ${i+1}`;
                    if (isShortQuiz) label = `Question ${i+1}`;
                    if (isFitb) label = `Fill in Blank ${i+1}`;

                    return (
                        <div key={i} className="glass-panel" style={{ padding: '1rem 1.25rem', minHeight: 'auto', borderLeft: isCorrect ? '4px solid #69db7c' : '4px solid #ff6b6b' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span className="stat-label">{label}</span>
                                <span style={{ fontWeight: 600, color: isCorrect ? '#69db7c' : '#ff6b6b', fontSize: '0.9rem' }}>{isCorrect ? 'Correct' : 'Review'}</span>
                            </div>
                            
                            <p style={{ fontSize: '1.05rem', margin: '0 0 0.8rem 0', fontWeight: 600 }}>
                                {isShortQuiz || isFitb ? res.target : `"${res.target}"`}
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: (isShortQuiz || isFitb) ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ fontSize: '0.7rem', display: 'block', opacity: 0.5, marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Answer:</span>
                                    <p style={{ margin: 0, fontStyle: 'italic', color: isCorrect ? '#69db7c' : '#ff6b6b', fontWeight: 500 }}>"{res.spoken || '(No speech)'}"</p>
                                </div>
                                
                                {isShortQuiz && (
                                    <div style={{ background: 'rgba(105, 219, 124, 0.05)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(105, 219, 124, 0.1)' }}>
                                        <span style={{ fontSize: '0.7rem', display: 'block', opacity: 0.5, marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{isCorrect ? 'Match Found:' : 'Expected word:'}</span>
                                        <p style={{ margin: 0, fontWeight: 700, color: '#69db7c' }}>{isCorrect ? (res.aiVerification?.feedback || res.expected) : res.expected}</p>
                                    </div>
                                )}
                            </div>
                            
                            {!isCorrect && res.aiVerification?.feedback && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ff6b6b', background: 'rgba(255, 107, 107, 0.05)', padding: '0.5rem', borderRadius: '6px' }}>
                                    💡 <strong>Coach Tip:</strong> {res.aiVerification.feedback}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="app-container" style={{ overflowY: 'auto' }}>
            <Navbar />
            
            <main style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem', paddingBottom: '4rem' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', borderRadius: '20px', padding: '2.5rem', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                    <header style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                            <div>
                                <h1 style={{ 
                                    fontSize: '2.5rem', 
                                    fontFamily: 'var(--font-serif)', 
                                    marginTop: 0,
                                    marginBottom: '0.25rem',
                                    background: 'linear-gradient(to right, #ffffff, var(--text-muted))',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>Session Analysis</h1>
                                <p style={{ opacity: 0.5, fontSize: '0.9rem', letterSpacing: '0.5px' }}>Recorded • {new Date(timestamp).toLocaleString()}</p>
                            </div>
                            <div style={{ textAlign: 'right', padding: '1rem 1.5rem', background: 'rgba(105, 219, 124, 0.1)', borderRadius: '16px', border: '1px solid rgba(105, 219, 124, 0.2)' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 300, lineHeight: 1, letterSpacing: '-1px', color: '#69db7c' }}>{metrics.fluencyScore}</div>
                                <div className="stat-label" style={{ marginTop: '0.5rem', color: '#69db7c', fontSize: '0.8rem' }}>Overall Fluency Score</div>
                            </div>
                        </div>
                    </header>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                        <div className="stat-card" style={{ background: 'var(--surface-2)', border: 'none' }}>
                            <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📝 Total Words</span>
                            <span className="stat-value">{metrics.totalWords}</span>
                        </div>
                        <div className="stat-card" style={{ background: 'var(--surface-2)', border: 'none' }}>
                            <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⏱️ Duration</span>
                            <span className="stat-value">{formatDuration(metrics.duration)}</span>
                        </div>
                        <div className="stat-card" style={{ background: 'var(--surface-2)', border: 'none' }}>
                            <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⚡ Avg Pace</span>
                            <span className="stat-value">{metrics.wpm} <span style={{fontSize:'1rem', opacity:0.5}}>WPM</span></span>
                        </div>
                        <div className="stat-card" style={{ background: 'var(--surface-2)', border: 'none' }}>
                            <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⚠️ Fillers</span>
                            <span className="stat-value" style={{ color: metrics.totalFillers > 5 ? '#ff6b6b' : 'inherit' }}>{metrics.totalFillers}</span>
                        </div>
                    </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem', marginBottom: '3rem' }}>
                    <section>
                        <h2 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', fontWeight: 600 }}>AI Feedback</h2>
                        <div className="glass-panel" style={{ padding: '1.5rem', minHeight: 'auto' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <span className="stat-label" style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--accent)' }}>Topic</span>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{aiAnalysis.topic}</div>
                            </div>
                            
                            <div style={{ marginBottom: '1.5rem' }}>
                                <span className="stat-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Performance Summary</span>
                                <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.9)' }}>{aiAnalysis.feedback}</p>
                            </div>

                            <div>
                                <span className="stat-label" style={{ display: 'block', marginBottom: '1rem' }}>Suggestions for improvement</span>
                                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {aiAnalysis.suggestions.map((s, i) => (
                                        <li key={i} style={{ 
                                            padding: '1rem 1.25rem', 
                                            background: 'rgba(255,255,255,0.05)', 
                                            borderRadius: '12px',
                                            borderLeft: '4px solid var(--accent)',
                                            fontSize: '1rem',
                                            lineHeight: 1.5
                                        }}>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </section>

                    <aside>
                        <h2 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', fontWeight: 600 }}>Deep Metrics</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div className="glass-panel" style={{ padding: '1rem', minHeight: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)' }}>
                                <span className="stat-label">Unique Words</span>
                                <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{metrics.uniqueWords}</span>
                            </div>
                            <div className="glass-panel" style={{ padding: '1rem', minHeight: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)' }}>
                                <span className="stat-label">Vocab Richness</span>
                                <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{metrics.vocabRichness}</span>
                            </div>
                            <div className="glass-panel" style={{ padding: '1rem', minHeight: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)' }}>
                                <span className="stat-label">Repeated Phrases</span>
                                <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{metrics.repeatedWordsCount}</span>
                            </div>
                            <div className="glass-panel" style={{ padding: '1rem', minHeight: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)' }}>
                                <span className="stat-label">Confidence (AI)</span>
                                <span style={{ fontWeight: 600, fontSize: '1.05rem', color: aiAnalysis.confidenceScore > 80 ? '#69db7c' : 'inherit' }}>{aiAnalysis.confidenceScore}%</span>
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '2rem' }}>
                            <Link href="/dashboard" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', textDecoration: 'none', padding: '0.8rem', fontSize: '1rem' }}>
                                Start New Session
                            </Link>
                        </div>
                    </aside>
                </div>

                <section>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>{report.repeatResults ? 'Sentence Review' : 'Annotated Transcript'}</h2>
                    {report.repeatResults ? (
                        renderRepeatResults(report.repeatResults)
                    ) : (
                        <div className="glass-panel" style={{ padding: '2.5rem', lineHeight: 2, fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)', background: 'var(--surface-2)', border: 'none' }}>
                            {renderTranscript()}
                        </div>
                    )}
                </section>
                </div>
            </main>
        </div>
    );
}
