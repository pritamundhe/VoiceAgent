'use client';

import { useState, useEffect, Suspense } from 'react';
import Navbar from '../../components/Navbar';
import useRecorder from '../../hooks/useRecorder';
import PaceChart from '../../components/PaceChart';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MODES } from '../../lib/modes';

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode') || '';
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isAnalyzingSession, setIsAnalyzingSession] = useState(false);

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
  } = useRecorder(mode, currentPrompt);

  const handleStopRecording = async () => {
      stopRecording();
      
      const fullTranscript = (
          chatHistory
            .filter(m => m.role === 'user')
            .map(m => m.content)
            .join(' ') + 
          ' ' + 
          transcript + 
          ' ' + 
          (currentTurn || '')
      ).trim();

      // If we have a transcript, trigger deep analysis
      if (fullTranscript.length > 0) {
          console.log('[Dashboard] Starting session analysis...', { transcriptLength: fullTranscript.length, duration, mode });
          setIsAnalyzingSession(true);
          try {
              const res = await fetch('/api/analyze-session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                      transcript: fullTranscript, 
                      duration: duration || 1, 
                      mode, 
                      prompt: currentPrompt 
                  })
              });
              
              if (!res.ok) {
                  const errorText = await res.text();
                  throw new Error(`API Error (${res.status}): ${errorText}`);
              }

              const data = await res.json();
              console.log('[Dashboard] Analysis complete:', data);

              if (data.metrics) {
                  const reportData = {
                      ...data,
                      transcript: fullTranscript,
                      modeTitle: selectedMode?.title || 'General Practice'
                  };
                  console.log('[Dashboard] Saving report to localStorage...', reportData);
                  localStorage.setItem('lastSessionReport', JSON.stringify(reportData));
                  
                  // Navigate to report
                  console.log('[Dashboard] Navigating to /session-report...');
                  router.push('/session-report');
                  
                  // Fallback if router fails
                  setTimeout(() => {
                      if (window.location.pathname !== '/session-report') {
                          console.log('[Dashboard] Router push failed, trying window.location.href');
                          window.location.href = '/session-report';
                      }
                  }, 100);

                  setIsAnalyzingSession(false);
              } else {
                  throw new Error('No metrics returned from analysis API');
              }
          } catch (err) {
              console.error('[Dashboard] Analysis failed:', err);
              setIsAnalyzingSession(false);
              alert('Analysis failed: ' + err.message);
          }
      } else {
          console.warn('[Dashboard] No transcript detected.');
          alert('No speech detected! Please make sure your microphone is working and speak during the session.');
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

    // Moved up for better scoping
  const selectedMode = MODES.find(m => m.id === mode);

  useEffect(() => {
    if (selectedMode && selectedMode.prompts && !currentPrompt) {
      const randomPrompt = selectedMode.prompts[Math.floor(Math.random() * selectedMode.prompts.length)];
      setCurrentPrompt(randomPrompt);
    }
  }, [selectedMode, currentPrompt]);

  const handleNewPrompt = () => {
    if (selectedMode && selectedMode.prompts) {
      let nextPrompt;
      do {
        nextPrompt = selectedMode.prompts[Math.floor(Math.random() * selectedMode.prompts.length)];
      } while (nextPrompt === currentPrompt && selectedMode.prompts.length > 1);
      setCurrentPrompt(nextPrompt);
    }
  };

  if (!mode) {
    return (
      <div className="app-container">
        <Navbar />
        <main className="practice-container" style={{ paddingTop: '2rem' }}>
          <header className="practice-header" style={{ marginBottom: '3rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Choose your scenario</h1>
            <p style={{ opacity: 0.7, fontSize: '1.1rem' }}>Select a mode to start your AI-powered speech analysis session.</p>
          </header>

          <div className="practice-grid">
            {MODES.map((m) => (
              <Link 
                key={m.id} 
                href={`/dashboard?mode=${m.id}`}
                style={{ textDecoration: 'none' }}
                className={`practice-card ${m.className}`}
              >
                <div className="card-bg-icon">{m.icon}</div>
                <h3>{m.title}</h3>
                <h4>{m.subtitle}</h4>
                <p>{m.description}</p>
              </Link>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />

      {isAnalyzingSession && (
          <div className="loading-overlay" style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(10px)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.5rem'
          }}>
              <div className="loader-ring"></div>
              <p style={{ fontSize: '1.25rem', fontWeight: 500, letterSpacing: '0.5px' }}>Analyzing your performance...</p>
              <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>OpenAI is evaluating your speech metrics and feedback.</p>
          </div>
      )}

      <main className="dashboard-grid">
        {/* Left Column: Recording and Transcript */}
        <section className="dashboard-col">
          {currentPrompt && (
            <div className="glass-panel" style={{ 
              marginBottom: '1rem', 
              padding: '1.2rem', 
              background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)',
              borderLeft: '4px solid var(--accent)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              minHeight: 'auto',
              flex: 'none'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6, fontWeight: 700 }}>Active Scenario Prompt</span>
                <p style={{ fontSize: '1.2rem', fontWeight: 500, marginTop: '0.5rem', lineHeight: '1.4' }}>"{currentPrompt}"</p>
              </div>
              <button 
                onClick={handleNewPrompt} 
                className="btn-link" 
                style={{ alignSelf: 'flex-start', fontSize: '0.8rem', opacity: 0.7 }}
              >
                ↻ Get another prompt
              </button>
            </div>
          )}

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
              {selectedMode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span className="mode-tag" style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.2rem 0.6rem', 
                    borderRadius: '12px', 
                    background: 'var(--surface-3)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600
                  }}>
                    {selectedMode.icon} {selectedMode.title}
                  </span>
                  <Link href="/dashboard" className="btn-link" style={{ fontSize: '0.75rem', opacity: 0.6 }}>Change</Link>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel transcript-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
            
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <span style={{ fontSize: '0.85rem', color: '#69db7c', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                    {msg.role === 'ai' ? 'OpenAI AI Coach' : 'You'}
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
                <span style={{ fontSize: '0.85rem', color: '#69db7c', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>OpenAI AI Coach</span>
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
