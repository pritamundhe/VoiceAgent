'use client';

import { useState, Suspense } from 'react';
import Navbar from '../../components/Navbar';
import useRecorder from '../../hooks/useRecorder';
import PaceChart from '../../components/PaceChart';
import { useSearchParams } from 'next/navigation';

function DashboardContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || '';

  const {
    isRecording,
    status,
    transcript,
    currentTurn,
    fillerCounts,
    totalFillers,
    totalWords,
    duration,
    wpm,
    grammarErrors,
    grammarSuggestions,
    paceHistory,
    fluency,
    chatHistory,
    isAnalyzingAI,
    startRecording,
    stopRecording,
    fetchAiFeedback
  } = useRecorder();

  const handleStopRecording = () => {
      stopRecording();
      if (transcript) {
          fetchAiFeedback(transcript, mode);
      }
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getFluencyScore = (score) => {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'average';
    return 'poor';
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="dashboard-grid">
        {/* Left Column: Recording and Transcript */}
        <section className="dashboard-col">
          <div className="controls-card">
            <button 
              className="btn btn-primary" 
              disabled={isRecording} 
              onClick={startRecording}
            >
              Start Recording
            </button>
            <button 
              className="btn btn-stop" 
              disabled={!isRecording} 
              onClick={handleStopRecording}
            >
              Stop Recording
            </button>
            <div className="status-bar">
              <div className="status-indicator">
                <div className={`dot ${isRecording ? 'recording' : ''}`}></div>
                <span id="statusText">{status}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel transcript-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
            
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <span style={{ fontSize: '0.85rem', color: msg.role === 'ai' ? '#69db7c' : 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                    {msg.role === 'ai' ? 'Gemini AI Coach' : 'You'}
                </span>
                <div style={{ fontSize: msg.role === 'ai' ? '1.1rem' : '1.05rem', lineHeight: '1.6', color: 'var(--text)', margin: 0 }}>
                    {msg.content}
                </div>
              </div>
            ))}

            {(transcript || currentTurn) && (
              <div className="chat-message user">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                  You {chatHistory.length > 0 ? <span style={{opacity: 0.5}}>(Speaking...)</span> : ''}
                </span>
                <div className="transcript-final" style={{ margin: 0 }}>
                  {transcript}
                  <span className="transcript-partial">{currentTurn}</span>
                </div>
              </div>
            )}

            {!transcript && !currentTurn && chatHistory.length === 0 && (
              <div className="chat-message user">
                <div className="transcript-final" style={{ margin: 0 }}>
                  <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Start speaking to see transcription...</span>
                </div>
              </div>
            )}

            {isAnalyzingAI && (
              <div className="chat-message ai">
                <span style={{ fontSize: '0.85rem', color: '#69db7c', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Gemini AI Coach</span>
                <div style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text)' }}>
                  <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Typing response...</span>
                </div>
              </div>
            )}
            
          </div>
        </section>

        {/* Right Column: Metrics and Analytics */}
        <section className="dashboard-col">
          <div className="filler-panel">
            <div className="filler-header">
              <span className="filler-label">Breakdown</span>
              <span className={`filler-total ${totalFillers > 0 ? 'has-fillers' : ''}`}>
                {totalFillers} total
              </span>
            </div>
            <div className="filler-pills">
              {Object.entries(fillerCounts).map(([word, count]) => (
                <div key={word} className={`pill ${count > 0 ? 'active' : ''}`}>
                  {word} <span className="pill-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="metrics-container">
            <div className="metrics-layout">
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">Words</span>
                  <span className={`stat-value ${isRecording ? 'live' : ''}`}>{totalWords}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Duration</span>
                  <span className={`stat-value ${isRecording ? 'live' : ''}`}>{formatDuration(duration)}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">WPM</span>
                  <span className={`stat-value ${isRecording ? 'live' : ''}`}>{wpm || '\u2014'}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Errors</span>
                  <span className={`stat-value ${grammarErrors > 0 ? 'has-errors' : ''}`}>{grammarErrors}</span>
                </div>
              </div>

              <div className="stat-card stat-card-fluency" data-score={getFluencyScore(fluency)}>
                <span className="stat-label">Fluency</span>
                <div className="gauge-container">
                    <svg className="gauge-svg" viewBox="0 0 100 100">
                      <circle className="gauge-bg" cx="50" cy="50" r="45"></circle>
                      <circle 
                        className="gauge-progress" 
                        cx="50" cy="50" r="45" 
                        style={{ strokeDasharray: `${fluency * 2.83}, 283` }}
                      ></circle>
                    </svg>
                    <span className="stat-value">{fluency}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <span className="stat-label">Pace over time</span>
            <div className="chart-container">
              <PaceChart data={paceHistory.data} labels={paceHistory.labels} />
            </div>
          </div>



          <div className="grammar-panel">
            <span className="filler-label">Grammar Suggestions</span>
            <div className="grammar-list">
              {grammarSuggestions.length === 0 ? (
                <div className="grammar-empty">No suggestions yet. Start speaking!</div>
              ) : (
                grammarSuggestions.map((s, i) => (
                  <div key={i} className="grammar-item">
                    <span className="grammar-bad">{s.bad}</span>
                    {s.fix && <><span className="grammar-arrow">→</span><span className="grammar-fix">{s.fix}</span></>}
                    <span className="grammar-msg">{s.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
