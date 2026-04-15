'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { TrendChart, FillerChart, CircularProgress } from '../../components/AnalyticsCharts';
import Link from 'next/link';

const Icon = ({ name, size = 16, color = 'currentColor' }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {name === 'Chart' && <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>}
            {name === 'Activity' && <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />}
            {name === 'Award' && <><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></>}
            {name === 'Target' && <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>}
        </svg>
    );
};

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

    return (
        <div className="analytics-page-wrapper">
            <Navbar />

            <main className="analytics-content">
                {loading ? (
                    <div className="center-msg">
                        <div className="loader"></div>
                        <p>Analyzing performance...</p>
                    </div>
                ) : error ? (
                    <div className="center-msg">
                        <h1>Something went wrong</h1>
                        <p>{error}</p>
                        <Link href="/auth/signin" className="btn-blue-solid">Sign In</Link>
                    </div>
                ) : data.totalSessions === 0 ? (
                    <div className="center-msg">
                        <h1>No Data Available</h1>
                        <p>Complete your first practice session to generate insights.</p>
                        <Link href="/practice" className="btn-blue-solid">Start Practice</Link>
                    </div>
                ) : (
                    (() => {
                        const totalFilled = Object.values(data.fillers).reduce((a, b) => a + b, 0);
                        const totalWords = data.totalSessions * (data.avgWpm || 100) * 2;
                        const fillerPercentage = totalWords > 0 ? ((totalFilled / totalWords) * 100).toFixed(1) : 0;
                        const paceScore = Math.min(100, Math.max(0, 100 - Math.abs(130 - data.avgWpm)));
                        const consistencyScore = data.totalSessions ? Math.min(100, data.totalSessions * 5).toFixed(0) : 0;

                        return (
                            <>
                                {/* GRID 1: IDENTITY & METRICS */}
                                <div className="top-grid">
                                    {/* CARD 2: Core Metrics */}
                                    <div className="analytic-card metrics-card">
                                        <header className="card-header">
                                            <span className="card-tag">Performance</span>
                                            <h3>Core Metrics</h3>
                                        </header>
                                        <div className="metrics-grid">
                                            <div className="metric-item">
                                                <label>EST. WORDS SPOKEN</label>
                                                <div className="val-large">~{totalWords}</div>
                                            </div>
                                            <div className="metric-item">
                                                <label>AVG. FLUENCY</label>
                                                <div className="val-large primary-text">{data.avgFluency}%</div>
                                            </div>
                                            <div className="metric-item">
                                                <label>AVERAGE PACE</label>
                                                <div className="val-large">{data.avgWpm} WPM</div>
                                            </div>
                                            <div className="metric-item">
                                                <label>FILLER RATIO</label>
                                                <div className="val-large warning-text">{fillerPercentage}%</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CARD 3: Health Gauges */}
                                    <div className="analytic-card progress-card">
                                        <header className="card-header">
                                            <span className="card-tag">Gauges</span>
                                            <h3>Speech Health</h3>
                                        </header>
                                        <div className="gauges-container">
                                            <div className="gauge-item">
                                                <CircularProgress value={data.avgFluency} max={100} size={100} strokeWidth={8} color="#3b82f6" label="Fluency" />
                                            </div>
                                            <div className="gauge-item">
                                                <CircularProgress value={paceScore.toFixed(0)} max={100} size={100} strokeWidth={8} color="#69db7c" label="Pace" />
                                            </div>
                                            <div className="gauge-item">
                                                <CircularProgress value={consistencyScore} max={100} size={100} strokeWidth={8} color="#a855f7" label="Consistency" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* GRID 2: CHARTS */}
                                <div className="bottom-grid">
                                    {/* CHART 1: Trends */}
                                    <div className="analytic-card chart-card wide">
                                        <header className="card-header">
                                            <Icon name="Activity" size={20} color="#3b82f6" />
                                            <h3>Performance Development</h3>
                                        </header>
                                        <div className="chart-wrapper">
                                            <TrendChart
                                                labels={data.trends.labels}
                                                datasets={[
                                                    { label: 'Fluency', data: data.trends.fluency, borderColor: '#3b82f6', backgroundColor: '#3b82f6' },
                                                    { label: 'WPM', data: data.trends.wpm, borderColor: '#eab308', backgroundColor: '#eab308' }
                                                ]}
                                            />
                                        </div>
                                    </div>

                                    {/* CHART 2: Fillers */}
                                    <div className="analytic-card chart-card">
                                        <header className="card-header">
                                            <Icon name="Target" size={20} color="#f87171" />
                                            <h3>Filler Breakdown</h3>
                                        </header>
                                        <div className="filler-content">
                                            <div className="donut-area">
                                                <FillerChart data={data.fillers} />
                                            </div>
                                            <div className="filler-list">
                                                {Object.entries(data.fillers).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([word, count], idx) => (
                                                    <div key={word} className="filler-row">
                                                        <span className="f-word">{word}</span>
                                                        <span className="f-count">{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        );
                    })()
                )}
            </main>

            <style jsx>{`
                .analytics-page-wrapper {
                    background: #0d1117;
                    height: 100vh;
                    overflow-y: auto;
                    color: #e6edf3;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
                }

                .loading-state, .empty-state, .error-state {
                    height: 100vh; 
                    background: #0d1117; 
                    color: #fff;
                    display: flex;
                    flex-direction: column;
                }
                .center-msg {
                    flex: 1;
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center; 
                    text-align: center; 
                    gap: 1.5rem;
                    padding-bottom: 4rem;
                }
                .center-msg h1 { font-size: 3rem; font-weight: 800; letter-spacing: -0.04em; margin:0; }
                .center-msg p { font-size: 1.15rem; color: #8b949e; max-width: 400px; line-height: 1.6; }

                .analytics-content {
                    width: 100%;
                    padding: 1.5rem 4rem;
                }

                .top-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.2rem;
                    margin-bottom: 1.2rem;
                }

                .bottom-grid {
                    display: grid;
                    grid-template-columns: 2fr 1.2fr;
                    gap: 1.5rem;
                }

                .analytic-card {
                    background: #0d1117;
                    border: 1px solid #30363d;
                    border-radius: 24px;
                    padding: 1.5rem;
                    transition: border-color 0.2s, background 0.2s;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                }
                .analytic-card:hover { border-color: #3b82f6; background: #12171f; }

                .card-header {
                    margin-bottom: 1.2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                }
                .card-header.row { flex-direction: row; align-items: center; gap: 1rem; }
                .card-tag { font-size: 0.65rem; font-weight: 800; color: #8b949e; text-transform: uppercase; letter-spacing: 0.1em; }
                .card-header h3 { font-size: 1.1rem; font-weight: 700; color: #fff; margin: 0; }

                /* Identity Card */
                .identity-body { display: flex; flex-direction: column; gap: 1rem; }
                .user-info label, .rank-info label, .xp-info label, .metric-item label { 
                    font-size: 0.6rem; font-weight: 800; color: #8b949e; letter-spacing: 0.05em; margin-bottom: 0.35rem; display: block;
                }
                .val-main { font-size: 1.4rem; font-weight: 800; color: #fff; }
                .rank-row { display: flex; gap: 1.5rem; }
                .val-sub { font-size: 1rem; font-weight: 700; color: #3b82f6; }
                .session-status { display: flex; justify-content: space-between; align-items: center; margin-top: 0.3rem; }
                .status-badge { background: rgba(105, 219, 124, 0.15); color: #69db7c; padding: 0.3rem 0.8rem; border-radius: 10px; font-size: 0.7rem; font-weight: 800; }
                .session-count { font-size: 0.85rem; color: #8b949e; font-weight: 600; }

                /* Metrics Card */
                .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
                .val-large { font-size: 1.6rem; font-weight: 800; color: #fff; }
                .primary-text { color: #3b82f6; }
                .warning-text { color: #f87171; }

                /* Gauges Card */
                .gauges-container { display: flex; justify-content: space-between; align-items: center; height: 100%; min-height: 120px; }

                /* Chart Cards */
                .chart-wrapper { height: 350px; width: 100%; border-radius: 20px; }
                .filler-content { display: flex; align-items: center; gap: 2rem; height: 280px; }
                .donut-area { flex: 1.5; height: 100%; }
                .filler-list { flex: 1; display: flex; flex-direction: column; gap: 1rem; }
                .filler-row { display: flex; justify-content: space-between; align-items: center; background: #161b22; padding: 0.8rem 1.2rem; border-radius: 16px; }
                .f-word { font-weight: 700; text-transform: capitalize; }
                .f-count { color: #3b82f6; font-weight: 800; }

                .btn-blue-solid {
                    background: #1e58f2;
                    color: #fff;
                    padding: 0.8rem 2rem;
                    border-radius: 12px;
                    font-weight: 700;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .btn-blue-solid:hover { background: #1a4cd2; transform: translateY(-1px); }

                .loader {
                    border: 4px solid #30363d;
                    border-top: 4px solid #3b82f6;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

                @media (max-width: 1250px) {
                    .top-grid { grid-template-columns: 1fr 1fr; }
                    .identity-card { grid-column: span 2; }
                    .bottom-grid { grid-template-columns: 1fr; }
                }

                @media (max-width: 800px) {
                    .top-grid { grid-template-columns: 1fr; }
                    .identity-card { grid-column: auto; }
                    .analytics-content { padding: 2rem; }
                }
            `}</style>
        </div>
    );
}
