'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { TrendChart, FillerChart, CircularProgress } from '../../components/AnalyticsCharts';

// -----------------------------------------------------------------------
// Heatmap: renders 53 weeks x 7 days of activity data
// Intensity based on session count: 0=none, 1=light, 2-3=medium, 4+=high
// -----------------------------------------------------------------------
function ActivityHeatmap({ heatmap }) {
  const today = new Date();
  const start = new Date(today);
  start.setFullYear(start.getFullYear() - 1);

  // Generate array of 365 days from 1 year ago to today
  const days = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const key = cursor.toISOString().split('T')[0];
    days.push({ date: key, count: heatmap[key] || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Pad start so week starts on Sunday
  const startDow = new Date(days[0].date).getDay();
  const padded = [...Array(startDow).fill(null), ...days];

  // Split into weeks
  const weeks = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  const getColor = (count) => {
    if (!count) return '#0d1117';
    if (count === 1) return '#1d3a1a';
    if (count <= 3) return '#2a6325';
    return '#3fb34a';
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="heatmap-wrapper">
      <div className="heatmap-months">
        {months.map(m => <span key={m}>{m}</span>)}
      </div>
      <div className="heatmap-body">
        <div className="heatmap-days">
          {dayLabels.map((d, i) => <span key={i}>{d}</span>)}
        </div>
        <div className="heatmap-grid">
          {weeks.map((week, wi) => (
            <div key={wi} className="heatmap-col">
              {week.map((day, di) => (
                <div
                  key={di}
                  className="heatmap-cell"
                  style={{ background: day ? getColor(day.count) : '#0d1117' }}
                  title={day ? `${day.date}: ${day.count} session${day.count !== 1 ? 's' : ''}` : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="heatmap-legend">
        <span>Less</span>
        {['#0d1117','#1d3a1a','#2a6325','#3fb34a'].map(c => (
          <div key={c} className="heatmap-cell" style={{ background: c }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------
// ML Score card — explains each ML metric with its score and meaning
// -----------------------------------------------------------------------
function MLInsightRow({ label, value, max = 100, description, unit = '' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="ml-row">
      <div className="ml-row-header">
        <span className="ml-label">{label}</span>
        <span className="ml-value" style={{ color }}>{typeof value === 'number' ? value.toFixed(value % 1 !== 0 ? 3 : 0) : value}{unit}</span>
      </div>
      <div className="ml-bar-track">
        <div className="ml-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="ml-desc">{description}</p>
    </div>
  );
}

// -----------------------------------------------------------------------
// Mode breakdown table row
// -----------------------------------------------------------------------
function ModeRow({ mode, sessions, avgFluency, avgWpm, avgMlScore }) {
  const bar = Math.min(100, avgMlScore);
  return (
    <div className="mode-row">
      <span className="mode-name">{mode.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
      <span className="mode-sessions">{sessions}</span>
      <span className="mode-fluency">{avgFluency}</span>
      <span className="mode-wpm">{avgWpm}</span>
      <div className="mode-ml-wrap">
        <span className="mode-ml-val">{avgMlScore}</span>
        <div className="mode-ml-bar" style={{ '--w': `${bar}%` }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetch('/api/analytics/detailed')
      .then(r => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="ap-page">
      <Navbar />
      <div className="ap-center">
        <div className="ap-spinner" />
        <p>Analyzing your performance...</p>
      </div>
      <PageStyle />
    </div>
  );

  if (error) return (
    <div className="ap-page">
      <Navbar />
      <div className="ap-center">
        <h2>Could not load analytics</h2>
        <p>{error}</p>
        <Link href="/auth/signin" className="ap-btn">Sign In</Link>
      </div>
      <PageStyle />
    </div>
  );

  if (data?.empty) return (
    <div className="ap-page">
      <Navbar />
      <div className="ap-center">
        <h2>No sessions yet</h2>
        <p>Complete your first practice session to generate insights.</p>
        <Link href="/practice" className="ap-btn">Start Practice</Link>
      </div>
      <PageStyle />
    </div>
  );

  const { user, totalSessions, avgFluency, avgWpm, avgMlScore,
          avgReadability, avgCoherence, avgDiversity, avgHesitation,
          mostUsedMode, modeBreakdown, trends, heatmap, fillers,
          bestSession, recentSessions, vocabGrowth } = data;

  const paceScore = Math.min(100, Math.max(0, 100 - Math.abs(130 - avgWpm)));

  return (
    <div className="ap-page">
      <Navbar />
      <main className="ap-main">

        {/* Page title */}
        <div className="ap-title-row">
          <div>
            <h1 className="ap-h1">Performance Analytics</h1>
            <p className="ap-sub">
              Statistical analysis across {totalSessions} session{totalSessions !== 1 ? 's' : ''}.
              ML metrics are computed using TF-IDF, Flesch readability, Simpson diversity, and Jaccard coherence models.
            </p>
          </div>
          <div className="ap-tabs">
            {['overview', 'ml insights', 'activity', 'sessions'].map(t => (
              <button key={t} className={`ap-tab ${activeTab === t ? 'active' : ''}`}
                onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ---- OVERVIEW TAB ---- */}
        {activeTab === 'overview' && (
          <>
            {/* Top stat row */}
            <div className="top-stat-row">
              {[
                { label: 'Total Sessions', value: totalSessions },
                { label: 'Avg Fluency', value: `${avgFluency}%`, color: '#3b82f6' },
                { label: 'Avg WPM', value: avgWpm },
                { label: 'Avg ML Score', value: `${avgMlScore}%`, color: '#a855f7' },
                { label: 'Most Practiced', value: mostUsedMode.replace(/-/g, ' '), small: true },
              ].map(s => (
                <div key={s.label} className="ts-card">
                  <span className="ts-label">{s.label}</span>
                  <span className="ts-val" style={{ color: s.color || '#f1f5f9', fontSize: s.small ? '1rem' : undefined }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Gauge row */}
            <div className="gauge-row">
              <div className="analytic-card">
                <h3 className="card-title">Speech Health Gauges</h3>
                <div className="gauges-flex">
                  <CircularProgress value={avgFluency} max={100} size={110} strokeWidth={9} color="#3b82f6" label="Fluency" />
                  <CircularProgress value={paceScore} max={100} size={110} strokeWidth={9} color="#22c55e" label="Pace" />
                  <CircularProgress value={Math.min(100, totalSessions * 5)} max={100} size={110} strokeWidth={9} color="#a855f7" label="Consistency" />
                  <CircularProgress value={avgMlScore} max={100} size={110} strokeWidth={9} color="#f59e0b" label="ML Score" />
                </div>
              </div>
            </div>

            {/* Trends chart */}
            <div className="analytic-card">
              <h3 className="card-title">Performance Trends — Last 30 Sessions</h3>
              <div className="chart-wrap">
                <TrendChart
                  labels={trends.labels}
                  datasets={[
                    { label: 'Fluency',  data: trends.fluency,  borderColor: '#3b82f6', backgroundColor: '#3b82f6' },
                    { label: 'WPM',      data: trends.wpm,      borderColor: '#f59e0b', backgroundColor: '#f59e0b' },
                    { label: 'ML Score', data: trends.mlScore,  borderColor: '#a855f7', backgroundColor: '#a855f7' },
                  ]}
                />
              </div>
            </div>

            {/* Filler words + Best session */}
            <div className="two-col-grid">
              <div className="analytic-card">
                <h3 className="card-title">Filler Word Distribution</h3>
                <div className="filler-list">
                  {Object.entries(fillers).length === 0 ? (
                    <p className="empty-msg">No filler words detected across sessions.</p>
                  ) : (
                    Object.entries(fillers)
                      .sort((a, b) => b[1] - a[1])
                      .map(([word, count]) => {
                        const max = Math.max(...Object.values(fillers));
                        return (
                          <div key={word} className="filler-row">
                            <span className="f-word">{word}</span>
                            <div className="f-bar-track">
                              <div className="f-bar-fill" style={{ width: `${(count / max) * 100}%` }} />
                            </div>
                            <span className="f-count">{count}</span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {bestSession && (
                <div className="analytic-card best-card">
                  <span className="best-label">Your Best Session</span>
                  <h3 className="best-topic">{bestSession.topic || bestSession.mode}</h3>
                  <div className="best-metrics">
                    <div className="best-metric">
                      <span className="bm-val" style={{ color: '#3b82f6' }}>{bestSession.fluencyScore}</span>
                      <span className="bm-sub">Fluency</span>
                    </div>
                    <div className="best-metric">
                      <span className="bm-val" style={{ color: '#a855f7' }}>{bestSession.mlScore}</span>
                      <span className="bm-sub">ML Score</span>
                    </div>
                    <div className="best-metric">
                      <span className="bm-val">{bestSession.wpm}</span>
                      <span className="bm-sub">WPM</span>
                    </div>
                  </div>
                  <div className="best-meta">
                    {bestSession.mode?.replace(/-/g, ' ')} &mdash;{' '}
                    {new Date(bestSession.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              )}
            </div>

            {/* Mode breakdown */}
            <div className="analytic-card">
              <h3 className="card-title">Per-Mode Breakdown</h3>
              <div className="mode-header-row">
                <span>Mode</span>
                <span>Sessions</span>
                <span>Avg Fluency</span>
                <span>Avg WPM</span>
                <span>Avg ML Score</span>
              </div>
              <div className="mode-body">
                {modeBreakdown.map(m => <ModeRow key={m.mode} {...m} />)}
              </div>
            </div>
          </>
        )}

        {/* ---- ML INSIGHTS TAB ---- */}
        {activeTab === 'ml insights' && (
          <div className="ml-insights">
            <div className="ml-intro">
              <h2 className="ml-intro-title">Machine Learning Speech Analysis</h2>
              <p className="ml-intro-body">
                Each session is analyzed using statistical NLP algorithms. The metrics below
                aggregate your results across all sessions. Hover over each metric name to understand
                what it measures and how to improve it.
              </p>
            </div>
            <div className="ml-grid">

              <div className="analytic-card ml-card">
                <h3 className="card-title">Hesitation Score</h3>
                <p className="ml-card-desc">
                  Models how fluent your delivery sounds based on filler word rate, consecutive
                  repetitions, and incomplete sentence density. Uses a graduated penalty model where
                  the cost of each additional filler word increases with frequency (mild: 3 pts/%, severe: 6 pts/%).
                </p>
                <MLInsightRow
                  label="Avg Hesitation Score"
                  value={avgHesitation}
                  description="100 = perfectly fluent. Penalty is applied for fillers (um, uh, like), consecutive word repetitions, and very short trailing sentences."
                />
              </div>

              <div className="analytic-card ml-card">
                <h3 className="card-title">Semantic Coherence</h3>
                <p className="ml-card-desc">
                  Uses Jaccard similarity between consecutive sentence token sets to measure how
                  logically your speech flows from one sentence to the next. A high score means
                  your ideas connect naturally without abrupt topic jumps.
                </p>
                <MLInsightRow
                  label="Avg Coherence Score"
                  value={avgCoherence}
                  description="Jaccard similarity of consecutive sentence vocabularies, mapped to 0-100. Scores 40-60 = acceptable; 75+ = strong narrative flow."
                />
              </div>

              <div className="analytic-card ml-card">
                <h3 className="card-title">Readability (Flesch)</h3>
                <p className="ml-card-desc">
                  The Flesch Reading Ease formula measures sentence length and syllable density.
                  For speech coaching, a score of 60-80 is ideal: accessible and clear without
                  being simplistic. Scores below 50 indicate overly complex vocabulary or
                  run-on sentences.
                </p>
                <MLInsightRow
                  label="Avg Readability Score"
                  value={avgReadability}
                  description="Formula: 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words). Range 0-100; higher = more readable."
                />
              </div>

              <div className="analytic-card ml-card">
                <h3 className="card-title">Vocabulary Diversity</h3>
                <p className="ml-card-desc">
                  Applies Simpson's Diversity Index from ecology to measure lexical diversity.
                  It calculates the probability that two randomly chosen words from your speech
                  are different. Stop words are excluded so the score reflects topical word range,
                  not common grammatical filler.
                </p>
                <MLInsightRow
                  label="Avg Vocabulary Diversity"
                  value={avgDiversity}
                  max={1}
                  description="D = 1 - sum(n_i*(n_i-1)) / N*(N-1). Range 0-1; values above 0.85 indicate strong vocabulary range."
                />
              </div>

              <div className="analytic-card ml-card full-width">
                <h3 className="card-title">TF-IDF Keyword Trends — Recent Sessions</h3>
                <p className="ml-card-desc">
                  TF-IDF (Term Frequency – Inverse Document Frequency) extracts the most
                  informative keywords from each session. High TF-IDF words are those you use
                  frequently that are rare in general English speech — revealing your actual
                  topical focus. Stop words are excluded from all calculations.
                </p>
                <div className="keyword-table">
                  {recentSessions?.filter(s => s.tfidfKeywords?.length > 0).slice(0, 5).map(s => (
                    <div key={s._id} className="kw-row">
                      <span className="kw-mode">
                        {s.mode?.replace(/-/g, ' ')} — {new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="kw-tags">
                        {s.tfidfKeywords.map(k => (
                          <span key={k} className="kw-tag">{k}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {(!recentSessions || recentSessions.every(s => !s.tfidfKeywords?.length)) && (
                    <p className="empty-msg">Keywords will appear after new sessions are completed.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ---- ACTIVITY TAB ---- */}
        {activeTab === 'activity' && (
          <div>
            <div className="analytic-card">
              <h3 className="card-title">Activity Heatmap — Last 365 Days</h3>
              <p className="ml-card-desc" style={{ marginTop: '0.5rem' }}>
                Each cell represents one day. Darker green indicates more sessions completed that day.
              </p>
              <ActivityHeatmap heatmap={heatmap || {}} />
            </div>

            <div className="analytic-card" style={{ marginTop: '1.5rem' }}>
              <h3 className="card-title">Vocabulary Growth Over Time</h3>
              <p className="ml-card-desc" style={{ marginTop: '0.5rem' }}>
                Unique word count per session. An upward trend indicates expanding vocabulary range.
              </p>
              <div className="chart-wrap">
                <TrendChart
                  labels={vocabGrowth?.map(v => v.date) || []}
                  datasets={[{
                    label: 'Unique Words',
                    data: vocabGrowth?.map(v => v.uniqueWords) || [],
                    borderColor: '#22c55e',
                    backgroundColor: '#22c55e',
                  }]}
                />
              </div>
            </div>
          </div>
        )}

        {/* ---- SESSIONS TAB ---- */}
        {activeTab === 'sessions' && (
          <div className="analytic-card">
            <h3 className="card-title">Recent Sessions</h3>
            <div className="sessions-header">
              <span>Mode</span>
              <span>Topic</span>
              <span>Fluency</span>
              <span>ML Score</span>
              <span>WPM</span>
              <span>Date</span>
            </div>
            <div className="sessions-body">
              {recentSessions?.map(s => (
                <div key={s._id} className="session-row">
                  <span className="sr-mode">
                    {s.mode?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                  <span className="sr-topic">{s.topic || '—'}</span>
                  <span className="sr-fluency" style={{ color: s.fluencyScore >= 75 ? '#22c55e' : '#f59e0b' }}>
                    {s.fluencyScore ?? '—'}
                  </span>
                  <span className="sr-ml" style={{ color: s.mlScore >= 75 ? '#a855f7' : '#64748b' }}>
                    {s.mlScore ?? '—'}
                  </span>
                  <span className="sr-wpm">{s.wpm ?? '—'}</span>
                  <span className="sr-date">
                    {new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <PageStyle />
    </div>
  );
}

function PageStyle() {
  return (
    <style jsx global>{`
      .ap-page {
        background: #080c14;
        min-height: 100vh;
        color: #e2e8f0;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .ap-main {
        max-width: 1100px;
        margin: 0 auto;
        padding: 2rem 2rem 5rem;
      }
      .ap-center {
        display: flex; flex-direction: column; align-items: center;
        justify-content: center; min-height: 80vh; gap: 1.2rem; text-align: center;
      }
      .ap-center h2 { font-size: 2rem; color: #f1f5f9; margin: 0; }
      .ap-center p  { color: #64748b; }
      .ap-btn {
        background: #1d4ed8; color: #fff;
        padding: 0.75rem 2rem; border-radius: 10px;
        text-decoration: none; font-weight: 700;
      }
      .ap-spinner {
        width: 40px; height: 40px;
        border: 3px solid #1e293b; border-top-color: #3b82f6;
        border-radius: 50%; animation: spin 0.8s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }

      /* Title row */
      .ap-title-row {
        display: flex; justify-content: space-between; align-items: flex-end;
        flex-wrap: wrap; gap: 1.5rem; margin-bottom: 2rem;
      }
      .ap-h1 { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.04em; color: #f8fafc; margin: 0 0 0.4rem; }
      .ap-sub { font-size: 0.82rem; color: #64748b; max-width: 520px; line-height: 1.5; margin: 0; }

      .ap-tabs {
        display: flex; gap: 0.4rem;
        background: #0f172a; border: 1px solid #1e293b;
        border-radius: 12px; padding: 0.3rem;
      }
      .ap-tab {
        background: none; border: none; color: #64748b;
        padding: 0.5rem 1rem; border-radius: 8px;
        cursor: pointer; font-size: 0.82rem; font-weight: 600; transition: all 0.2s;
      }
      .ap-tab.active { background: #0c2340; color: #93c5fd; }
      .ap-tab:hover:not(.active) { color: #94a3b8; }

      /* Cards */
      .analytic-card {
        background: #0d1117;
        border: 1px solid #1e293b;
        border-radius: 20px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        transition: border-color 0.2s;
      }
      .analytic-card:hover { border-color: #334155; }
      .card-title { font-size: 1rem; font-weight: 700; color: #f1f5f9; margin: 0 0 1.2rem; }

      /* Top stat row */
      .top-stat-row {
        display: grid; grid-template-columns: repeat(5, 1fr);
        gap: 1rem; margin-bottom: 1.5rem;
      }
      .ts-card {
        background: #0d1117; border: 1px solid #1e293b; border-radius: 16px;
        padding: 1.2rem; display: flex; flex-direction: column; gap: 0.4rem;
      }
      .ts-label { font-size: 0.6rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; }
      .ts-val { font-size: 1.6rem; font-weight: 800; color: #f1f5f9; line-height: 1; }

      /* Gauge row */
      .gauge-row { }
      .gauges-flex { display: flex; justify-content: space-around; flex-wrap: wrap; gap: 1rem; padding: 0.5rem 0; }

      /* Chart */
      .chart-wrap { height: 300px; }
      .two-col-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

      /* Filler list */
      .filler-list { display: flex; flex-direction: column; gap: 0.75rem; }
      .filler-row { display: flex; align-items: center; gap: 0.75rem; }
      .f-word { font-weight: 700; font-size: 0.85rem; width: 80px; flex-shrink: 0; }
      .f-bar-track { flex: 1; height: 6px; background: #1e293b; border-radius: 99px; overflow: hidden; }
      .f-bar-fill { height: 100%; background: #ef4444; border-radius: 99px; }
      .f-count { font-size: 0.8rem; color: #ef4444; font-weight: 700; width: 30px; text-align: right; }

      /* Best session card */
      .best-card { display: flex; flex-direction: column; gap: 0.8rem; }
      .best-label { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; }
      .best-topic { font-size: 1.2rem; font-weight: 700; color: #f1f5f9; margin: 0; line-height: 1.3; }
      .best-metrics { display: flex; gap: 2rem; }
      .best-metric { display: flex; flex-direction: column; }
      .bm-val { font-size: 1.8rem; font-weight: 800; }
      .bm-sub { font-size: 0.7rem; color: #64748b; }
      .best-meta { font-size: 0.75rem; color: #475569; text-transform: capitalize; }

      /* Mode breakdown */
      .mode-header-row {
        display: grid; grid-template-columns: 2fr 80px 100px 80px 1fr;
        padding: 0.5rem 0; font-size: 0.65rem; font-weight: 800; color: #475569;
        text-transform: uppercase; letter-spacing: 0.08em;
        border-bottom: 1px solid #1e293b;
      }
      .mode-body { display: flex; flex-direction: column; gap: 0; }
      .mode-row {
        display: grid; grid-template-columns: 2fr 80px 100px 80px 1fr;
        align-items: center; padding: 0.9rem 0;
        border-bottom: 1px solid #0f172a; font-size: 0.85rem;
      }
      .mode-row:last-child { border-bottom: none; }
      .mode-name { font-weight: 600; color: #f1f5f9; text-transform: capitalize; }
      .mode-sessions, .mode-fluency, .mode-wpm { color: #94a3b8; font-weight: 600; }
      .mode-ml-wrap { display: flex; align-items: center; gap: 0.75rem; }
      .mode-ml-val { font-weight: 700; color: #a855f7; width: 30px; }
      .mode-ml-bar {
        flex: 1; height: 4px; background: #1e293b; border-radius: 99px;
        position: relative; overflow: hidden;
      }
      .mode-ml-bar::after {
        content: '';
        display: block;
        height: 100%;
        width: var(--w);
        background: #a855f7;
        border-radius: 99px;
      }

      /* ML insights */
      .ml-insights { }
      .ml-intro {
        background: #0d1117; border: 1px solid #1e293b;
        border-radius: 20px; padding: 1.5rem; margin-bottom: 1.5rem;
      }
      .ml-intro-title { font-size: 1.1rem; font-weight: 700; color: #f1f5f9; margin: 0 0 0.75rem; }
      .ml-intro-body { font-size: 0.85rem; color: #64748b; line-height: 1.6; margin: 0; }
      .ml-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
      .ml-card { display: flex; flex-direction: column; gap: 0.75rem; }
      .ml-card.full-width { grid-column: span 2; }
      .ml-card-desc { font-size: 0.8rem; color: #64748b; line-height: 1.55; margin: 0; }

      .ml-row { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.5rem; }
      .ml-row-header { display: flex; justify-content: space-between; }
      .ml-label { font-size: 0.8rem; font-weight: 700; color: #94a3b8; }
      .ml-value { font-size: 0.9rem; font-weight: 800; }
      .ml-bar-track { height: 6px; background: #1e293b; border-radius: 99px; overflow: hidden; }
      .ml-bar-fill { height: 100%; border-radius: 99px; transition: width 0.6s ease; }
      .ml-desc { font-size: 0.75rem; color: #475569; margin: 0; line-height: 1.5; }

      .keyword-table { display: flex; flex-direction: column; gap: 0; margin-top: 0.75rem; }
      .kw-row {
        display: flex; align-items: center; gap: 1rem;
        padding: 0.75rem 0; border-bottom: 1px solid #0f172a;
      }
      .kw-row:last-child { border-bottom: none; }
      .kw-mode { font-size: 0.78rem; color: #64748b; min-width: 180px; text-transform: capitalize; }
      .kw-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
      .kw-tag {
        background: #0c1c34; border: 1px solid #1e3a5f;
        color: #93c5fd; padding: 0.2rem 0.6rem;
        border-radius: 6px; font-size: 0.75rem; font-weight: 600;
      }

      /* Heatmap */
      .heatmap-wrapper { margin-top: 1rem; }
      .heatmap-months {
        display: flex; justify-content: space-between;
        font-size: 0.65rem; color: #475569; margin-bottom: 0.4rem;
        padding-left: 24px;
      }
      .heatmap-body { display: flex; gap: 0.5rem; }
      .heatmap-days {
        display: flex; flex-direction: column; gap: 2px;
        font-size: 0.6rem; color: #475569;
        padding-top: 2px;
      }
      .heatmap-days span { height: 12px; display: flex; align-items: center; }
      .heatmap-grid { display: flex; gap: 2px; flex: 1; overflow-x: auto; }
      .heatmap-col { display: flex; flex-direction: column; gap: 2px; }
      .heatmap-cell {
        width: 12px; height: 12px;
        border-radius: 2px;
        border: 1px solid rgba(255,255,255,0.04);
        flex-shrink: 0;
        cursor: default;
        transition: opacity 0.1s;
      }
      .heatmap-cell:hover { opacity: 0.7; }
      .heatmap-legend {
        display: flex; align-items: center; gap: 4px;
        font-size: 0.65rem; color: #475569; margin-top: 0.75rem;
        justify-content: flex-end;
      }

      /* Activity / Sessions tabs */
      .sessions-header {
        display: grid; grid-template-columns: 1.5fr 2fr 80px 80px 70px 90px;
        font-size: 0.65rem; font-weight: 800; color: #475569;
        text-transform: uppercase; letter-spacing: 0.08em;
        padding-bottom: 0.75rem; border-bottom: 1px solid #1e293b;
      }
      .sessions-body { display: flex; flex-direction: column; }
      .session-row {
        display: grid; grid-template-columns: 1.5fr 2fr 80px 80px 70px 90px;
        align-items: center; padding: 0.9rem 0;
        border-bottom: 1px solid #0f172a; font-size: 0.85rem;
      }
      .session-row:last-child { border-bottom: none; }
      .sr-mode { font-weight: 600; color: #f1f5f9; text-transform: capitalize; }
      .sr-topic { color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 1rem; }
      .sr-fluency, .sr-ml, .sr-wpm { font-weight: 700; }
      .sr-wpm { color: #94a3b8; }
      .sr-date { color: #475569; font-size: 0.78rem; }

      .empty-msg { color: #475569; font-size: 0.85rem; font-style: italic; }

      @media (max-width: 900px) {
        .top-stat-row { grid-template-columns: repeat(3, 1fr); }
        .ml-grid { grid-template-columns: 1fr; }
        .ml-card.full-width { grid-column: span 1; }
        .two-col-grid { grid-template-columns: 1fr; }
        .mode-header-row, .mode-row { grid-template-columns: 1.5fr 60px 80px 60px 1fr; }
        .sessions-header, .session-row { grid-template-columns: 1.2fr 1.5fr 70px 70px 60px 80px; }
      }
      @media (max-width: 600px) {
        .top-stat-row { grid-template-columns: repeat(2, 1fr); }
        .ap-h1 { font-size: 1.6rem; }
        .ap-title-row { flex-direction: column; align-items: flex-start; }
      }
    `}</style>
  );
}
